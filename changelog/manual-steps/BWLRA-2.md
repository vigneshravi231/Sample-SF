# BWRLA-2 - Leads API

### Manual steps

#### Create/Update named credentials 
1. Goto `Setup > Named Credentials > New`
2. Set fields as follows:
    - **URL** *dev*: https://lead-registration-api.us-e2.cloudhub.io/api
    - **URL** *uat*: https://lead-registration-api-uat.us-e2.cloudhub.io/api
    - **Label**: LeadApi
    - **Name**: LeadApi
    - **Identity Type**: Named Principal
    - **Authentication Protocol**: Password Authentication
    - **Username** *client_id*: `34a36139d66442e98534790429eb0ccc` 
    - **Password** *client_secret*: `79e722f32A2249ED93E2e3794828F0c1` 
    - check "Allow merge fields in http headers"
