import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("CertificateRegistry", function () {
  let registry: any;
  let admin: any;
  let unauthorizedAccount: any;

  beforeEach(async function () {
    const signers = await ethers.getSigners();
    admin = signers[0];
    unauthorizedAccount = signers[1];
    registry = await ethers.deployContract("CertificateRegistry");
  });

  it("Should set the deployer (admin) as an automatically authorized issuer", async function () {
    expect(await registry.admin()).to.equal(admin.address);
    expect(await registry.isAuthorizedIssuer(admin.address)).to.be.true;
  });

  it("Should issue a certificate successfully and emit CertificateIssued event", async function () {
    const sampleString = "Priya Kumar - DOB 15-06-2026 - Erode Hospital";
    const documentHash = ethers.keccak256(ethers.toUtf8Bytes(sampleString));
    const certificateId = "BC-2026-004521";

    await expect(registry.issueCertificate(certificateId, documentHash))
      .to.emit(registry, "CertificateIssued")
      .withArgs(certificateId, documentHash, admin.address, (issueDate: bigint) => issueDate > 0n);
  });

  it("Should verify a genuine certificate", async function () {
    const sampleString = "Priya Kumar - DOB 15-06-2026 - Erode Hospital";
    const documentHash = ethers.keccak256(ethers.toUtf8Bytes(sampleString));
    const certificateId = "BC-2026-004521";

    await registry.issueCertificate(certificateId, documentHash);

    const isGenuine = await registry.verifyCertificate(certificateId, documentHash);
    expect(isGenuine).to.be.true;
  });

  it("Should detect a tampered certificate", async function () {
    const genuineString = "Priya Kumar - DOB 15-06-2026 - Erode Hospital";
    const genuineHash = ethers.keccak256(ethers.toUtf8Bytes(genuineString));
    const certificateId = "BC-2026-004521";

    await registry.issueCertificate(certificateId, genuineHash);

    const tamperedString = "Priya Kumar - DOB 15-06-2024 - Erode Hospital";
    const tamperedHash = ethers.keccak256(ethers.toUtf8Bytes(tamperedString));

    const isGenuine = await registry.verifyCertificate(certificateId, tamperedHash);
    expect(isGenuine).to.be.false;
  });

  it("Should fail when issuing a certificate with a duplicate certificateId", async function () {
    const sampleString = "Priya Kumar - DOB 15-06-2026 - Erode Hospital";
    const documentHash = ethers.keccak256(ethers.toUtf8Bytes(sampleString));
    const certificateId = "BC-2026-004521";

    await registry.issueCertificate(certificateId, documentHash);

    await expect(
      registry.issueCertificate(certificateId, documentHash)
    ).to.be.revertedWith("CertificateRegistry: Certificate ID already exists");
  });

  it("Should revert when a non-authorized address attempts to issue a certificate", async function () {
    const sampleString = "Priya Kumar - DOB 15-06-2026 - Erode Hospital";
    const documentHash = ethers.keccak256(ethers.toUtf8Bytes(sampleString));
    const certificateId = "BC-2026-004521";

    await expect(
      registry.connect(unauthorizedAccount).issueCertificate(certificateId, documentHash)
    ).to.be.revertedWith("CertificateRegistry: Only authorized issuers can call this function");
  });
});
