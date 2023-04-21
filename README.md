# Compiling smart contracts with hardhat
```
cd contracts
npx hardhat compile
```

# Testing smart contracts with hardhat
```
npx hardhat test test/DCAManagerTests.ts
```
[Learn More about testing with hardhat](https://hardhat.org/hardhat-runner/docs/guides/test-contracts)

## Checking for code coverage
```
npx hardhat coverage
```

## Errors to deal with
- not enough balance to DCA
This isn't assigned anywhere and in the function performDCA, it will revert so this code needs to be removed and performs that status can be assigned when a dca is first created if the user does not have enough balance. the front end may have to check balance amounts if anything. Also, how does this impact a situtaion where superfluid money streams are used?


