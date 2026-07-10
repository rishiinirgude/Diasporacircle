#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Symbol, Set, Map};

#[contracttype]
#[derive(Clone)]
pub struct ReputationProfile {
    pub wallet: Address,
    pub circles_completed: u32,
    pub total_on_time: u32,
    pub total_late: u32,
    pub total_defaulted: u32,
    pub score: u32,
}

#[contracttype]
#[derive(Clone, Debug, Copy)]
pub enum DataKey {
    Admin,
    Profile(Address),
    AuthorizedCircles,
}

#[contract]
pub struct ReputationContract;

#[contractimpl]
impl ReputationContract {
    /// Initialize the contract with admin
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().persistent().has(&DataKey::Admin) {
            panic!("Contract already initialized");
        }
        env.storage().persistent().set(&DataKey::Admin, &admin);
        env.storage().persistent().set(&DataKey::AuthorizedCircles, &Set::new(&env));
    }

    /// Authorize a circle contract to record cycles
    pub fn authorize_circle(env: Env, admin: Address, circle: Address) {
        admin.require_auth();

        let stored_admin: Address = env.storage().persistent().get(&DataKey::Admin)
            .expect("Contract not initialized");

        if admin != stored_admin {
            panic!("Unauthorized");
        }

        let mut authorized: Set<Address> = env.storage().persistent().get(&DataKey::AuthorizedCircles)
            .expect("Authorized circles not initialized");

        authorized.insert(circle);
        env.storage().persistent().set(&DataKey::AuthorizedCircles, &authorized);
    }

    /// Record a cycle completion by a member in a circle
    pub fn record_cycle(env: Env, circle: Address, member: Address, paid_on_time: bool) {
        circle.require_auth();

        let authorized: Set<Address> = env.storage().persistent().get(&DataKey::AuthorizedCircles)
            .expect("Authorized circles not initialized");

        if !authorized.contains(&circle) {
            panic!("Circle not authorized");
        }

        let mut profile = env.storage().persistent()
            .get::<DataKey, ReputationProfile>(&DataKey::Profile(member.clone()))
            .unwrap_or_else(|| ReputationProfile {
                wallet: member.clone(),
                circles_completed: 0,
                total_on_time: 0,
                total_late: 0,
                total_defaulted: 0,
                score: 0,
            });

        if paid_on_time {
            profile.total_on_time += 1;
        } else {
            profile.total_defaulted += 1;
        }

        // Recompute score: (on_time * 1000) / (on_time + late + defaulted)
        let total = profile.total_on_time + profile.total_late + profile.total_defaulted;
        if total > 0 {
            profile.score = ((profile.total_on_time as u64 * 1000) / total as u64) as u32;
            // Apply consistency multiplier: min(circles_completed / 5, 1.0)
            let consistency_factor = if profile.circles_completed < 5 {
                profile.circles_completed as u64
            } else {
                5u64
            };
            profile.score = ((profile.score as u64 * consistency_factor) / 5u64) as u32;
            
            // Cap at 1000
            if profile.score > 1000 {
                profile.score = 1000;
            }
        }

        profile.circles_completed += 1;
        env.storage().persistent().set(&DataKey::Profile(member), &profile);
    }

    /// Get reputation profile for a wallet
    pub fn get_profile(env: Env, member: Address) -> ReputationProfile {
        env.storage().persistent().get::<DataKey, ReputationProfile>(&DataKey::Profile(member))
            .unwrap_or_else(|| ReputationProfile {
                wallet: member,
                circles_completed: 0,
                total_on_time: 0,
                total_late: 0,
                total_defaulted: 0,
                score: 0,
            })
    }
}

#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn test_initialization() {
        let env = Env::default();
        let contract_id = env.register_contract(None, ReputationContract);
        
        let admin = Address::generate(&env);
        let client = ReputationContractClient::new(&env, &contract_id);
        
        client.initialize(&admin);
        // If we reach here, initialization succeeded
    }
}
