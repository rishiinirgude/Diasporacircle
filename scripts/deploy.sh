#!/bin/bash

# ============================================================================
# Deployment Script for DiasporaCircle
# Handles contract deployment, database setup, and service deployment
# ============================================================================

set -e

NETWORK="${1:-testnet}"
ACTION="${2:-deploy-all}"

echo "🚀 DiasporaCircle Deployment Script"
echo "Network: $NETWORK"
echo "Action: $ACTION"
echo ""

# ============================================================================
# Deploy Smart Contracts
# ============================================================================
deploy_contracts() {
    echo "📦 Deploying smart contracts to $NETWORK..."
    
    # Circle Contract
    echo "  → Deploying Circle contract..."
    cd packages/contracts/circle
    make build
    make deploy NETWORK=$NETWORK
    CIRCLE_ID=$(cat .contract-id)
    cd ../../../
    
    # Reputation Contract
    echo "  → Deploying Reputation contract..."
    cd packages/contracts/reputation
    make build
    make deploy NETWORK=$NETWORK
    REP_ID=$(cat .contract-id)
    cd ../../../
    
    echo "✅ Contracts deployed!"
    echo "  Circle Contract ID: $CIRCLE_ID"
    echo "  Reputation Contract ID: $REP_ID"
    echo ""
    echo "📝 Update .env with:"
    echo "  CIRCLE_CONTRACT_ID=$CIRCLE_ID"
    echo "  REPUTATION_CONTRACT_ID=$REP_ID"
}

# ============================================================================
# Setup Database
# ============================================================================
setup_database() {
    echo "🗄️ Setting up database..."
    
    # Start Docker services
    echo "  → Starting PostgreSQL and Redis..."
    docker compose up -d postgres redis
    
    # Wait for services
    sleep 5
    
    # Run migrations
    echo "  → Running Prisma migrations..."
    pnpm --filter backend run db:migrate
    
    echo "✅ Database ready!"
}

# ============================================================================
# Build All Packages
# ============================================================================
build_all() {
    echo "🔨 Building all packages..."
    pnpm install
    pnpm build
    echo "✅ Build complete!"
}

# ============================================================================
# Deploy Backend
# ============================================================================
deploy_backend() {
    echo "🚀 Deploying backend..."
    
    if command -v railway &> /dev/null; then
        railway deploy --service backend
        echo "✅ Backend deployed to Railway!"
    elif command -v vercel &> /dev/null; then
        echo "⚠️  Manual deployment required to your backend host"
        echo "   Build: pnpm build"
        echo "   Start: pnpm --filter backend run start"
    else
        echo "❌ No deployment CLI found. Please deploy manually."
        exit 1
    fi
}

# ============================================================================
# Deploy Frontend
# ============================================================================
deploy_frontend() {
    echo "🌐 Deploying frontend..."
    
    if command -v vercel &> /dev/null; then
        vercel deploy --prod
        echo "✅ Frontend deployed to Vercel!"
    elif command -v netlify &> /dev/null; then
        netlify deploy --prod --dir=packages/frontend/dist
        echo "✅ Frontend deployed to Netlify!"
    else
        echo "❌ No deployment CLI found. Please deploy manually."
        exit 1
    fi
}

# ============================================================================
# Main execution
# ============================================================================

case $ACTION in
    deploy-contracts)
        deploy_contracts
        ;;
    setup-db)
        setup_database
        ;;
    build)
        build_all
        ;;
    deploy-backend)
        deploy_backend
        ;;
    deploy-frontend)
        deploy_frontend
        ;;
    deploy-all)
        build_all
        setup_database
        deploy_contracts
        deploy_backend
        deploy_frontend
        echo ""
        echo "✅ Full deployment complete!"
        ;;
    *)
        echo "Usage: ./scripts/deploy.sh [testnet|public] [deploy-all|deploy-contracts|setup-db|build|deploy-backend|deploy-frontend]"
        echo ""
        echo "Examples:"
        echo "  ./scripts/deploy.sh testnet deploy-all         # Full deployment to testnet"
        echo "  ./scripts/deploy.sh testnet deploy-contracts   # Deploy only contracts"
        echo "  ./scripts/deploy.sh public setup-db            # Setup database for mainnet"
        exit 1
        ;;
esac
