import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("CertificateRegistry", function () {
  async function deployCertificateRegistryFixture() {
    const [admin, issuer1, issuer2, user] = await ethers.getSigners();
    const registry = await ethers.deployContract("CertificateRegistry");
    return { registry, admin, issuer1, issuer2, user };
  }

  it("Should set the deployer as admin and authorized issuer", async function () {
    const { registry, admin } = await deployCertificateRegistryFixture();
    expect(await registry.admin()).to.equal(admin.address);
    expect(await registry.isAuthorizedIssuer(admin.address)).to.be.true;
  });

  it("Should allow admin to authorize and revoke issuers", async function () {
    const { registry, admin, issuer1 } = await deployCertificateRegistryFixture();

    await expect(registry.connect(admin).authorizeIssuer(issuer1.address))
      .to.emit(registry, "IssuerStatusChanged")
      .withArgs(issuer1.address, true);

    expect(await registry.isAuthorizedIssuer(issuer1.address)).to.be.true;

    await expect(registry.connect(admin).revokeIssuer(issuer1.address))
      .to.emit(registry, "IssuerStatusChanged")
      .withArgs(issuer1.address, false);

    expect(await registry.isAuthorizedIssuer(issuer1.address)).to.be.false;
  });

  it("Should prevent unauthorized users from issuing certificates", async function () {
    const { registry, user } = await deployCertificateRegistryFixture();
    const docHash = ethers.keccak256(ethers.toUtf8Bytes("Sample Certificate"));

    await expect(
      registry.connect(user).issueCertificate("CERT-001", docHash)
    ).to.be.revertedWith("CertificateRegistry: Only authorized issuers can call this function");
  });

  it("Should issue a certificate and emit CertificateIssued event", async function () {
    const { registry, admin } = await deployCertificateRegistryFixture();
    const docHash = ethers.keccak256(ethers.toUtf8Bytes("John Doe Degree Certificate"));

    await expect(registry.connect(admin).issueCertificate("CERT-2026-001", docHash))
      .to.emit(registry, "CertificateIssued");

    const cert = await registry.getCertificate("CERT-2026-001");
    expect(cert.documentHash).to.equal(docHash);
    expect(cert.issuer).to.equal(admin.address);
    expect(cert.exists).to.be.true;
    expect(cert.issueDate).to.be.greaterThan(0n);
  });

  it("Should fail when issuing a duplicate certificate ID", async function () {
    const { registry, admin } = await deployCertificateRegistryFixture();
    const docHash = ethers.keccak256(ethers.toUtf8Bytes("Degree Certificate"));

    await registry.connect(admin).issueCertificate("CERT-2026-001", docHash);

    await expect(
      registry.connect(admin).issueCertificate("CERT-2026-001", docHash)
    ).to.be.revertedWith("CertificateRegistry: Certificate ID already exists");
  });

  it("Should verify valid and invalid certificate hashes", async function () {
    const { registry, admin } = await deployCertificateRegistryFixture();
    const validHash = ethers.keccak256(ethers.toUtf8Bytes("Valid Certificate Content"));
    const wrongHash = ethers.keccak256(ethers.toUtf8Bytes("Tampered Certificate Content"));

    await registry.connect(admin).issueCertificate("CERT-2026-002", validHash);

    expect(await registry.verifyCertificate("CERT-2026-002", validHash)).to.be.true;
    expect(await registry.verifyCertificate("CERT-2026-002", wrongHash)).to.be.false;
    expect(await registry.verifyCertificate("NON-EXISTENT", validHash)).to.be.false;
  });
});
