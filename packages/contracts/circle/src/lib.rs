#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Symbol, Vec};

#[contracttype]
#[derive(Clone)]
pub struct CircleConfig {
    pub organizer: Address,
    pub contribution_amount: i128,
    pub escrow_asset: Address,
    pub cycle_length_days: u32,
    pub total_members: u32,
    pub current_cycle: u32,
    pub payout_order: Vec<Address>,
    pub status: Symbol,
    pub reputation_contract: Address,
}

#[contracttype]
#[derive(Clone)]
pub struct MemberInfo {
    pub address: Address,
    pub joined_at: u64,
    pub security_deposit_paid: bool,
    pub cycles_paid_on_time: u32,
    pub cycles_defaulted: u32,
}

#[contracttype]
#[derive(Clone)]
pub struct CycleState {
    pub cycle_index: u32,
    pub recipient: Address,
    pub deadline_timestamp: u64,
    pub contributions_received: u32,
    pub total_escrowed: i128,
    pub disbursed: bool,
}

#[contracttype]
#[derive(Clone, Debug)]
pub enum DataKey {
    Circle,
    Member(Address),
    Cycle(u32),
    ContributionStatus(u32, Address),
}

#[contract]
pub struct CircleContract;

#[contractimpl]
impl CircleContract {
    /// Initialize the contract with circle configuration
    pub fn initialize(
        env: Env,
        organizer: Address,
        config: CircleConfig,
    ) {
        organizer.require_auth();

        // Ensure no double-init
        if env.storage().persistent().has(&DataKey::Circle) {
            panic!("Contract already initialized");
        }

        env.storage().persistent().set(&DataKey::Circle, &config);
    }

    /// Member pays security deposit to join circle
    pub fn pay_security_deposit(env: Env, member: Address) {
        member.require_auth();

        let config: CircleConfig = env.storage().persistent().get(&DataKey::Circle)
            .expect("Contract not initialized");

        if config.status != Symbol::new(&env, "Pending") {
            panic!("Circle must be in Pending status");
        }

        // Verify member is in payout_order
        let mut found = false;
        for addr in config.payout_order.iter() {
            if addr == member {
                found = true;
                break;
            }
        }
        if !found {
            panic!("Member not in payout order");
        }

        // Transfer tokens
        let token_client = soroban_sdk::token::Client::new(&env, &config.escrow_asset);
        token_client.transfer(&member, &env.current_contract_address(), &config.contribution_amount);

        // Mark deposit as paid
        let mut member_info = env.storage().persistent()
            .get::<DataKey, MemberInfo>(&DataKey::Member(member.clone()))
            .unwrap_or_else(|| MemberInfo {
                address: member.clone(),
                joined_at: env.ledger().timestamp(),
                security_deposit_paid: false,
                cycles_paid_on_time: 0,
                cycles_defaulted: 0,
            });

        member_info.security_deposit_paid = true;
        env.storage().persistent().set(&DataKey::Member(member), &member_info);
    }

    /// Start the circle after all security deposits are paid
    pub fn start_circle(env: Env, organizer: Address) {
        organizer.require_auth();

        let mut config: CircleConfig = env.storage().persistent().get(&DataKey::Circle)
            .expect("Contract not initialized");

        if config.status != Symbol::new(&env, "Pending") {
            panic!("Circle must be in Pending status");
        }

        // Verify all members have paid security deposit
        for member in config.payout_order.iter() {
            let member_info = env.storage().persistent()
                .get::<DataKey, MemberInfo>(&DataKey::Member(member.clone()))
                .expect("Member not registered");

            if !member_info.security_deposit_paid {
                panic!("Not all members have paid security deposit");
            }
        }

        config.status = Symbol::new(&env, "Active");
        env.storage().persistent().set(&DataKey::Circle, &config);

        // Initialize first cycle
        let first_recipient = config.payout_order.get(0).expect("No members in payout order");
        let deadline = env.ledger().timestamp() + (config.cycle_length_days as u64 * 86400);

        let cycle = CycleState {
            cycle_index: 0,
            recipient: first_recipient,
            deadline_timestamp: deadline,
            contributions_received: 0,
            total_escrowed: 0,
            disbursed: false,
        };

        env.storage().persistent().set(&DataKey::Cycle(0), &cycle);
    }

    /// Member contributes to current cycle
    pub fn contribute(env: Env, member: Address, cycle_index: u32) {
        member.require_auth();

        let config: CircleConfig = env.storage().persistent().get(&DataKey::Circle)
            .expect("Contract not initialized");

        if config.status != Symbol::new(&env, "Active") {
            panic!("Circle must be active");
        }

        if cycle_index != config.current_cycle {
            panic!("Wrong cycle index");
        }

        // Verify member is in payout_order
        let mut found = false;
        for addr in config.payout_order.iter() {
            if addr == member {
                found = true;
                break;
            }
        }
        if !found {
            panic!("Member not in payout order");
        }

        // Check not already contributed
        if env.storage().persistent().has(&DataKey::ContributionStatus(cycle_index, member.clone())) {
            panic!("Member already contributed this cycle");
        }

        let cycle: CycleState = env.storage().persistent().get(&DataKey::Cycle(cycle_index))
            .expect("Cycle not found");

        if env.ledger().timestamp() > cycle.deadline_timestamp {
            panic!("Contribution deadline passed");
        }

        // Transfer tokens
        let token_client = soroban_sdk::token::Client::new(&env, &config.escrow_asset);
        token_client.transfer(&member, &env.current_contract_address(), &config.contribution_amount);

        // Mark as contributed
        env.storage().persistent().set(&DataKey::ContributionStatus(cycle_index, member), &true);

        // Update cycle state
        let mut updated_cycle = cycle;
        updated_cycle.contributions_received += 1;
        updated_cycle.total_escrowed += config.contribution_amount;

        env.storage().persistent().set(&DataKey::Cycle(cycle_index), &updated_cycle);

        // Try to disburse if all contributed
        if updated_cycle.contributions_received == config.total_members {
            Self::try_disburse(&env, cycle_index);
        }
    }

    /// Attempt to disburse pot if all members have contributed
    fn try_disburse(env: &Env, cycle_index: u32) {
        let mut config: CircleConfig = env.storage().persistent().get(&DataKey::Circle)
            .expect("Contract not initialized");

        let mut cycle: CycleState = env.storage().persistent().get(&DataKey::Cycle(cycle_index))
            .expect("Cycle not found");

        if cycle.disbursed {
            return;
        }

        // Disburse to recipient
        let token_client = soroban_sdk::token::Client::new(env, &config.escrow_asset);
        token_client.transfer(&env.current_contract_address(), &cycle.recipient, &cycle.total_escrowed);

        cycle.disbursed = true;
        env.storage().persistent().set(&DataKey::Cycle(cycle_index), &cycle);

        // Record on-time cycles for members
        for member in config.payout_order.iter() {
            if env.storage().persistent().has(&DataKey::ContributionStatus(cycle_index, member.clone())) {
                let mut member_info = env.storage().persistent()
                    .get::<DataKey, MemberInfo>(&DataKey::Member(member.clone()))
                    .expect("Member not found");
                member_info.cycles_paid_on_time += 1;
                env.storage().persistent().set(&DataKey::Member(member), &member_info);
            }
        }

        // Advance to next cycle if not at end
        if config.current_cycle + 1 < config.total_members {
            config.current_cycle += 1;
            let next_recipient = config.payout_order.get(config.current_cycle)
                .expect("Invalid payout order index");
            let next_deadline = env.ledger().timestamp() + (config.cycle_length_days as u64 * 86400);

            let new_cycle = CycleState {
                cycle_index: config.current_cycle,
                recipient: next_recipient,
                deadline_timestamp: next_deadline,
                contributions_received: 0,
                total_escrowed: 0,
                disbursed: false,
            };

            env.storage().persistent().set(&DataKey::Circle, &config);
            env.storage().persistent().set(&DataKey::Cycle(config.current_cycle), &new_cycle);
        } else {
            config.status = Symbol::new(env, "Completed");
            env.storage().persistent().set(&DataKey::Circle, &config);
        }
    }

    /// Force disburse after deadline (applicable after deadline passes)
    pub fn force_disburse_after_deadline(env: Env, organizer: Address, cycle_index: u32) {
        organizer.require_auth();

        let config: CircleConfig = env.storage().persistent().get(&DataKey::Circle)
            .expect("Contract not initialized");

        let mut cycle: CycleState = env.storage().persistent().get(&DataKey::Cycle(cycle_index))
            .expect("Cycle not found");

        if env.ledger().timestamp() <= cycle.deadline_timestamp {
            panic!("Deadline not passed yet");
        }

        if cycle.disbursed {
            panic!("Cycle already disbursed");
        }

        // Mark non-contributors as defaulted
        for member in config.payout_order.iter() {
            if !env.storage().persistent().has(&DataKey::ContributionStatus(cycle_index, member.clone())) {
                let mut member_info = env.storage().persistent()
                    .get::<DataKey, MemberInfo>(&DataKey::Member(member.clone()))
                    .unwrap_or_else(|| MemberInfo {
                        address: member.clone(),
                        joined_at: env.ledger().timestamp(),
                        security_deposit_paid: false,
                        cycles_paid_on_time: 0,
                        cycles_defaulted: 0,
                    });
                member_info.cycles_defaulted += 1;
                env.storage().persistent().set(&DataKey::Member(member), &member_info);
            }
        }

        // Disburse what's escrowed
        let token_client = soroban_sdk::token::Client::new(&env, &config.escrow_asset);
        if cycle.total_escrowed > 0 {
            token_client.transfer(&env.current_contract_address(), &cycle.recipient, &cycle.total_escrowed);
        }

        cycle.disbursed = true;
        env.storage().persistent().set(&DataKey::Cycle(cycle_index), &cycle);

        // Advance cycle
        Self::try_disburse(&env, cycle_index);
    }

    /// Get circle configuration
    pub fn get_circle_config(env: Env) -> CircleConfig {
        env.storage().persistent().get(&DataKey::Circle)
            .expect("Contract not initialized")
    }

    /// Get cycle state
    pub fn get_cycle_state(env: Env, cycle_index: u32) -> CycleState {
        env.storage().persistent().get(&DataKey::Cycle(cycle_index))
            .expect("Cycle not found")
    }

    /// Get member info
    pub fn get_member_info(env: Env, member: Address) -> MemberInfo {
        env.storage().persistent().get::<DataKey, MemberInfo>(&DataKey::Member(member))
            .expect("Member not found")
    }

    /// Check if member contributed to cycle
    pub fn has_contributed(env: Env, cycle_index: u32, member: Address) -> bool {
        env.storage().persistent().has(&DataKey::ContributionStatus(cycle_index, member))
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::{Address as _, Ledger};

    #[test]
    fn test_initialization() {
        let env = Env::default();
        let contract_id = env.register_contract(None, CircleContract);
        
        let organizer = Address::generate(&env);
        let member1 = Address::generate(&env);
        let token = Address::generate(&env);

        let config = CircleConfig {
            organizer: organizer.clone(),
            contribution_amount: 1000,
            escrow_asset: token,
            cycle_length_days: 30,
            total_members: 3,
            current_cycle: 0,
            payout_order: Vec::from_slice(&env, &[member1.clone()]),
            status: Symbol::new(&env, "Pending"),
            reputation_contract: Address::generate(&env),
        };

        let client = CircleContractClient::new(&env, &contract_id);
        client.initialize(&organizer, &config);

        let stored = client.get_circle_config();
        assert_eq!(stored.contribution_amount, 1000);
        assert_eq!(stored.status, Symbol::new(&env, "Pending"));
    }
}
