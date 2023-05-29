

import { LightningElement } from "lwc";
import Sample_CONTACT_BANNER_URL from "@salesforce/resourceUrl/SampleContactBanner";
import VEHICLE_SUPPORT_ONLINE_URL from "@salesforce/resourceUrl/VehicleSupportOnline";
import VEHICLE_SUPPORT_OFFLINE_URL from "@salesforce/resourceUrl/VehicleSupportChatOffline";
import LIFT_SUPPORT_ONLINE_URL from "@salesforce/resourceUrl/LiftSupportOnline";
import LIFT_SUPPORT_OFFLINE_URL from "@salesforce/resourceUrl/LiftSupportChatOffline";
import INSIDE_SALES_ONLINE_URL from "@salesforce/resourceUrl/InsideSalesChatOnline";
import INSIDE_SALES_OFFLINE_URL from "@salesforce/resourceUrl/InsideSalesChatOffline";
import FINANCE_ONLINE_URL from "@salesforce/resourceUrl/FinanceOnline";
import FINANCE_OFFLINE_URL from "@salesforce/resourceUrl/FinanceOffline";
import LIFT_SALES_ONLINE_URL from "@salesforce/resourceUrl/LiftSalesOnline";
import LIFT_SALES_OFFLINE_URL from "@salesforce/resourceUrl/LiftSalesOffline";

export default class ContactUs extends LightningElement {
  SampleContactBannerUrl = Sample_CONTACT_BANNER_URL;

  supportLinkInfo = [
    {
      onlineImage: VEHICLE_SUPPORT_ONLINE_URL,
      offlineImage: VEHICLE_SUPPORT_OFFLINE_URL,
      agentId: "573j0000000Gzb8",
      isOnline: true
    },
    {
      onlineImage: LIFT_SUPPORT_ONLINE_URL,
      offlineImage: LIFT_SUPPORT_OFFLINE_URL,
      agentId: "573j0000000Gzb6",
      isOnline: true
    },
    {
      onlineImage: INSIDE_SALES_ONLINE_URL,
      offlineImage: INSIDE_SALES_OFFLINE_URL,
      agentId: "573j0000000Gzb7",
      isOnline: true
    },
    {
      onlineImage: FINANCE_ONLINE_URL,
      offlineImage: FINANCE_OFFLINE_URL,
      agentId: "573j0000000Gzbt",
      isOnline: true
    },
    {
      onlineImage: LIFT_SALES_ONLINE_URL,
      offlineImage: LIFT_SALES_OFFLINE_URL,
      agentId: "5730a000000TbkZ",
      isOnline: true
    }
  ];

  connectedCallback() {
    if (!window._laq) {
      window._laq = [];
    }

    this.supportLinkInfo.forEach((item) => {
      window._laq.push(function () {
        liveagent.showWhenOnline(
          item.agentId,
          this.template.querySelector(`[data-agent-id="${item.agentId}"]`)
        );
        liveagent.showWhenOffline(
          item.agentId,
          this.template.querySelector(`[data-agent-id="${item.agentId}"]`)
        );
      });
    });
  }

  startChat(event) {
    const agentId = event.target.dataset.agentId;
    console.log(agentId);
    liveagent.startChat(agentId);
  }
}
