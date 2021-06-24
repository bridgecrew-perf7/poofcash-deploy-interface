import React from "react";
import { Container, Flex, Text, Card, Button } from "theme-ui";
import { Header } from "components/Header";
import "i18n/config";
import { useTranslation } from "react-i18next";
import { useContractKit } from "@celo-tools/use-contractkit";
import { useAsyncState } from "hooks/useAsyncState";
import { Deployer } from "generated/Deployer";
import DeployerABI from "abis/Deployer.json";
import { AbiItem, toWei } from "web3-utils";
import { BlockscoutAddressLink } from "components/Links";
import { ACTIONS, NETWORK_NAME } from "config";

const DEPLOYER_ADDR = "0x60483A552391b4388C1F03af4cEf38e51ab00FA2";

const App: React.FC = () => {
  const { t } = useTranslation();
  const { address, connect, destroy, kit, performActions } = useContractKit();
  const { actions, salt } = ACTIONS;

  const initialDeploymentMap = actions.reduce((acc, action) => {
    return { ...acc, [action.contract]: false };
  }, {});

  const deployedMapCall = React.useCallback(async () => {
    const bytecodes = await Promise.all(
      actions.map((action) => kit.web3.eth.getCode(action.expectedAddress))
    );
    return actions.reduce((acc, action, idx) => {
      const isDeployed = bytecodes[idx] && bytecodes[idx] !== "0x";
      console.log(action.contract, bytecodes[idx]);
      return { ...acc, [action.contract]: isDeployed };
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
          const isDeployed = deployedMap[action.contract];
          const disabled = (() => {
            if (!address) {
              return true;
            }
            if (isDeployed) {
              return true;
            }
            // The first action only has a dependency on itself
            if (idx === 0) {
              return isDeployed;
            }
            const previousDeployed = deployedMap[actions[idx - 1].contract];

            // All other actions are disabled if the previous action has not yet been deployed
            // or itself has already been deployed
            return !previousDeployed || isDeployed;
          })();

          return (
            <Card key={idx} mb={4} p={4}>
              <Flex
                sx={{ justifyContent: "space-between", alignItems: "center" }}
              >
                <Container>
                  <Text>{action.contract}</Text>
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
