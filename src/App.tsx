import React from "react";
import { Container, Flex, Text, Card, Button } from "theme-ui";
import { Header } from "components/Header";
import "i18n/config";
import { useTranslation } from "react-i18next";
import { useContractKit } from "@ubeswap/use-contractkit";
import { useAsyncState } from "hooks/useAsyncState";
import { Deployer } from "generated/Deployer";
import DeployerABI from "abis/Deployer.json";
import IERC20ABI from "abis/IERC20.json";
import { AbiItem, toWei } from "web3-utils";
import { BlockscoutAddressLink } from "components/Links";
import { ACTIONS, NETWORK_NAME } from "config";
import { IERC20 } from "generated/IERC20";

const DEPLOYER_ADDR = "0x60483A552391b4388C1F03af4cEf38e51ab00FA2";

const App: React.FC = () => {
  const { t } = useTranslation();
  const { address, connect, destroy, kit, performActions } = useContractKit();
  const { actions, salt } = ACTIONS;

  const initialDeploymentMap = actions.reduce((acc, action) => {
    return { ...acc, [action.expectedAddress]: false };
  }, {});

  const deployedMapCall = React.useCallback(async () => {
    const voucherAddr = actions.find((a) => a.contract === "Voucher.sol")!
      .expectedAddress;
    const voucherDeployed = await kit.web3.eth
      .getCode(voucherAddr)
      .then((bytecode) => bytecode && bytecode !== "0x");
    const voucher =
      voucherDeployed &&
      ((new kit.web3.eth.Contract(
        IERC20ABI as AbiItem[],
        voucherAddr
      ) as unknown) as IERC20);
    const isDeployedList = await Promise.all(
      actions.map((action) => {
        if (action.contract === "Airdrop.sol") {
          if (!voucher) {
            return false;
          }
          return voucher.methods
            .balanceOf(action.expectedAddress)
            .call()
            .then((bal) => bal === "0");
        }
        return kit.web3.eth.getCode(action.expectedAddress).then((bytecode) => {
          return bytecode && bytecode !== "0x";
        });
      })
    );
    return actions.reduce((acc, action, idx) => {
      return { ...acc, [action.expectedAddress]: isDeployedList[idx] };
    }, {});
  }, [actions, kit]);
  const [deployedMap, refetchDeployedMap] = useAsyncState<
    Record<string, boolean>
  >(initialDeploymentMap, deployedMapCall);

  const total = Object.keys(deployedMap).length;
  const deployed = Object.values(deployedMap).reduce(
    (acc, deployed) => acc + (deployed ? 1 : 0),
    0
  );

  const deploy = React.useCallback(
    async (bytecode: string, salt: string, withProxy: boolean) => {
      await performActions(async (kit) => {
        const deployer = withProxy
          ? ((new kit.web3.eth.Contract(
              DeployerABI as AbiItem[],
              actions[0].expectedAddress
            ) as unknown) as Deployer)
          : ((new kit.web3.eth.Contract(
              DeployerABI as AbiItem[],
              DEPLOYER_ADDR
            ) as unknown) as Deployer);

        try {
          await deployer.methods.deploy(bytecode, salt).send({
            from: kit.defaultAccount,
            gasPrice: toWei("0.1", "gwei"),
            gas: 2e7,
          });
          refetchDeployedMap();
        } catch (e) {
          alert(e.message);
        }
      });
    },
    [actions, performActions, refetchDeployedMap]
  );

  return (
    <Container
      sx={{
        mx: [4, "15%"],
        my: [4, 4],
        maxWidth: "100%",
        width: "auto",
      }}
    >
      <Header />
      <Container
        sx={{
          mt: 6,
        }}
      >
        <Flex sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Container>
            <Text variant="title" mb={1}>
              {t("title")}
            </Text>
            <br />
            <Text variant="regularGray">{t("subtitle")}</Text>
          </Container>
          {!address && (
            <Button sx={{ width: "200px" }} onClick={connect}>
              Connect Wallet
            </Button>
          )}
        </Flex>
        <Flex sx={{ alignItems: "baseline" }} mt={5} mb={2}>
          <Text variant="bold">Connected wallet:</Text>
          {address ? (
            <>
              <Text ml={2}>{address}</Text>
              <Text
                sx={{ alignSelf: "center", cursor: "pointer" }}
                variant="wallet"
                ml={1}
                onClick={destroy}
              >
                (Disconnect)
              </Text>
            </>
          ) : (
            <Text ml={2}>No wallet connected.</Text>
          )}
        </Flex>
        <Container mb={2}>
          <Text variant="bold">Progress:</Text>
          <Text ml={2}>
            {deployed} / {total}
          </Text>
        </Container>
        <Container mb={3}>
          <Text variant="bold">Network:</Text>
          <Text ml={2}>{NETWORK_NAME}</Text>
        </Container>

        {actions.map((action, idx) => {
          const isDeployed = deployedMap[action.expectedAddress];
          const disabled = (() => {
            if (!address) {
              return true;
            }
            if (isDeployed) {
              return true;
            }
            return action.dependsOn
              .map((addr) => deployedMap[addr])
              .some((dep) => !dep);
          })();

          return (
            <Card key={idx} mb={4} p={4}>
              <Flex
                sx={{ justifyContent: "space-between", alignItems: "center" }}
              >
                <Container mr={4}>
                  <Text>
                    {action.title} ({action.contract})
                  </Text>
                  <br />
                  <Text variant="regularGray">{action.description}</Text>
                </Container>
                {isDeployed ? (
                  <BlockscoutAddressLink address={action.expectedAddress}>
                    Deployed
                  </BlockscoutAddressLink>
                ) : (
                  <Button
                    onClick={() => deploy(action.bytecode, salt, idx !== 0)}
                    disabled={disabled}
                  >
                    Deploy
                  </Button>
                )}
              </Flex>
            </Card>
          );
        })}
      </Container>
    </Container>
  );
};

export default App;
