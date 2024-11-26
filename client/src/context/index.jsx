import React, { useContext, createContext } from "react";
import {
  useAddress,
  useContract,
  useMetamask,
  useContractWrite,
} from "@thirdweb-dev/react";
import { ethers } from "ethers";

const StateContext = createContext();

export const StateContextProvider = ({ children }) => {
  //
  //0xdf29a5212283cABE9fD09F8Eb526ADDB50aEF1CA
  const { contract } = useContract(
    "0x60f63a4cAB0FAcF9E2557A1C0faBb6f5C80affbA"
  );
  //way to write contract
  const { mutateAsync: createCampaign } = useContractWrite(
    contract,
    "createCampaign"
  );

  const address = useAddress();
  const connect = useMetamask();

  const publishCampaign = async (form) => {
    try {
      const data = await createCampaign({
        args: [
          address, // owner
          form.title, // title
          form.description, // description
          form.target,
          new Date(form.deadline).getTime(), // deadline,
          form.image,
        ],
      });

      console.log("contract called success", data);
    } catch (error) {
      console.log("Contract called failure", error);
    }
  };

  const getCampaigns = async () => {
    const campaigns = await contract.call("getCampaigns");
    // console.log(campaigns)
    const parsedCampaigns = campaigns.map((campaign, i) => ({
      owner: campaign.owner,
      title: campaign.title,
      description: campaign.description,
      target: ethers.utils.formatEther(campaign.target.toString()),
      deadline: campaign.deadline.toNumber(),
      amountCollected: ethers.utils.formatEther(
        campaign.amountCollected.toString()
      ),
      image: campaign.image,
      pId: i,
    }));
    return parsedCampaigns;
  };

  const getUserCampaigns = async()=>{
    const allCampaigns = await getCampaigns();

    const filterCampaigns = allCampaigns.filter((campaign)=> campaign.owner === address);

    return filterCampaigns;

  }

  const donate = async(pId, amount)=>{
    const data = await contract.call('donationToCampaign',[pId],{ value:ethers.utils.parseEther(amount)});

    return data;
  }

  const getDonations = async (pId)=>{
    const donations = await contract.call('getDonators',[pId]);
    const numberOfDonations = donations[0].length;

    const parsedDonations = [];

    for (let i = 0; i < numberOfDonations; i++) {
      parsedDonations.push({
        donator:donations[0][i],
        donation:ethers.utils.formatEther(donations[1][i].toString())
      })
      
    }
    return parsedDonations;
  }
  return (
    <StateContext.Provider
      value={{
        address,
        contract,
        connect,
        createCampaign: publishCampaign,
        getCampaigns,
        getUserCampaigns,
        donate,
        getDonations,
      }}
    >
      {children}
    </StateContext.Provider>
  );
};

export const useStateContext = () => useContext(StateContext);
