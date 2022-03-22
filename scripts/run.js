const main = async()=>{
    const [signer, randomPerson] = await hre.ethers.getSigners();
    const contractFactory = await hre.ethers.getContractFactory("Domains");
    const contract = await contractFactory.deploy("pom");
    await contract.deployed();
    console.log("Deployed at: ", contract.address);
    console.log("Owned by: ", await contract.owner());

    let txn = await contract.register("papa", {value : hre.ethers.utils.parseEther('0.3')});
    await txn.wait();

    let domainOwner = await contract.getAddress("papa");
    console.log("Owner of domain :" , domainOwner) ;

    domainOwner =await contract.getAddress("lala");
    console.log("Owner of domain: ", domainOwner);

    let balance = await hre.ethers.provider.getBalance(contract.address);
    console.log("contract balance: " , hre.ethers.utils.formatEther(balance));
    try {
        let withdraw = await contract.connect(randomPerson).withdraw();
        await withdraw.wait()
    } catch(error) {
        console.log("Could not rob contract")
    }

    let ownerBalance = await hre.ethers.provider.getBalance(contract.owner());
    console.log("Owner balance before withdrawal", hre.ethers.utils.formatEther(ownerBalance));

    withdraw = await contract.withdraw()

    ownerBalance = await hre.ethers.provider.getBalance(contract.owner());
    balance = await hre.ethers.provider.getBalance(contract.address);
    console.log("Contract Balance after withdrawal", hre.ethers.utils.formatEther(balance));
    console.log("Owner Balance after withdrawal", hre.ethers.utils.formatEther(ownerBalance));
    

}

const runMain = async () => {
    try{
        await main();
        process.exit(0);
    } catch(error){
        console.log(error);
        process.exit(1);
    }
}

runMain()


