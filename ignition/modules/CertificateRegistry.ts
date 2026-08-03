import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const CertificateRegistryModule = buildModule("CertificateRegistryModule", (m) => {
  const certificateRegistry = m.contract("CertificateRegistry");

  return { certificateRegistry };
});

export default CertificateRegistryModule;
