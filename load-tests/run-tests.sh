#!/bin/bash

# Load Testing Runner Script for TrendAnkara

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create results directory
RESULTS_DIR="./load-tests/results"
mkdir -p $RESULTS_DIR

echo -e "${GREEN}==================================${NC}"
echo -e "${GREEN}TrendAnkara Load Testing Suite${NC}"
echo -e "${GREEN}==================================${NC}"
echo ""

# Function to run a test
run_test() {
    local TEST_NAME=$1
    local TEST_FILE=$2
    local OUTPUT_FILE="$RESULTS_DIR/${TEST_NAME}_$(date +%Y%m%d_%H%M%S).json"

    echo -e "${YELLOW}Running ${TEST_NAME}...${NC}"
    echo "Output will be saved to: $OUTPUT_FILE"
    echo ""

    k6 run --out json=$OUTPUT_FILE $TEST_FILE

    echo ""
    echo -e "${GREEN}${TEST_NAME} completed!${NC}"
    echo "----------------------------------------"
    echo ""
}

# Menu
echo "Select test to run:"
echo "1) Baseline Test (10-20 users, 3.5 minutes)"
echo "2) Stress Test (up to 200 users, 14 minutes)"
echo "3) Spike Test (sudden surge to 200 users, 3 minutes)"
echo "4) Endurance Test (30 users for 19 minutes)"
echo "5) Quick Test (5 users, 1 minute)"
echo "6) Run All Tests (Sequential)"
echo ""

read -p "Enter choice [1-6]: " choice

case $choice in
    1)
        run_test "baseline" "./load-tests/baseline-test.js"
        ;;
    2)
        run_test "stress" "./load-tests/stress-test.js"
        ;;
    3)
        run_test "spike" "./load-tests/spike-test.js"
        ;;
    4)
        run_test "endurance" "./load-tests/endurance-test.js"
        ;;
    5)
        # Quick test for immediate feedback
        echo -e "${YELLOW}Running Quick Test...${NC}"
        k6 run -u 5 -d 1m ./load-tests/baseline-test.js
        ;;
    6)
        echo -e "${RED}Warning: This will run all tests sequentially and take about 40 minutes!${NC}"
        read -p "Continue? (y/n): " confirm
        if [[ $confirm == [yY] ]]; then
            run_test "baseline" "./load-tests/baseline-test.js"
            sleep 30
            run_test "spike" "./load-tests/spike-test.js"
            sleep 30
            run_test "stress" "./load-tests/stress-test.js"
            sleep 30
            run_test "endurance" "./load-tests/endurance-test.js"
        fi
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}Testing complete!${NC}"
echo "Results saved in: $RESULTS_DIR"