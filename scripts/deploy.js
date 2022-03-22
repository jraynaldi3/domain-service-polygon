const main = async()=>{
    const [signer] = await hre.ethers.getSigners();
    const contractFactory = await hre.ethers.getContractFactory("Domains");
    const contract = await contractFactory.deploy("pom");
    await contract.deployed();
    console.log("Deployed at: ", contract.address);
    console.log("Deployed by: ", signer.address);

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


