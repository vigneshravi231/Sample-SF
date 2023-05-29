
public with sharing class AssetService {

	private static AssetService instance;
	public static AssetService getInstance() {
		if (instance == null) {
			instance = (AssetService) ServiceFactory.get(AssetService.class);
		}

		return instance;
	}

	public Asset fetchAssetDetails(String recordId) {
		return [
			SELECT
				Name,
				VIN_Serial_Number__c,
				PurchaseDate,
				Account.Phone,
				Account.Id,
				Account.BillingStreet,
				Account.BillingCity,
				Account.BillingState,
				Account.BillingCountry,
				Account.BillingPostalCode,
				Model__c,
				Status,
				Part_Class__c,
				Product_Description__c,
				Product_Group__r.Name,
				Selling_Dealer__c,
				Selling_Dealer__r.Name,
				Selling_Dealer__r.Id,
				Selling_Dealer__r.Phone,
				Product2Id,
				Product2.Name,
				TitleWebLinkeActive__c,
				TitleWebLinkActiveDate__c,
				Last_Recorded_Mileage__c,
				TitleWebLink__c,
				WinStickTitleWebLinkeActive__c,
				WinStickTitleWebLinkActiveDate__c,
				WinStickWebLink__c,
				Manufacturing_Date__c
			FROM Asset
			WHERE Id = :recordId
		];
	}

	public Boolean isRegistered(Id assetId){
		return checkRegistration(new Set<Id>{assetId}).isRegistered(assetId);
	}

	public WarrantyRegistrationCheck checkRegistration(Set<Id> assetIds){
		return new WarrantyRegistrationCheck(assetIds);
	}

	public List<Asset> fetchAssetsForAccount(Id accountId) {
		Set<Id> dealers = sharedDealers(accountId);

		return [
			SELECT
				Name,
				VIN_Serial_Number__c,
				Selling_Dealer__r.Name,
				
				Product2.ProductCode, (SELECT Id FROM Entitlements)
			FROM Asset
			WHERE Selling_Dealer__c IN:dealers
		];
	}

	public List<ProductService.SimpleProduct> fetchPartsFor(Id assetId, Id webstoreId, Id effectiveAccountId) {
		Asset asset = fetchAssetDetails(assetId);

		Set<String> partNames = makePartsCallout(asset);

		Set<Id> entitledPartIds = EntitledProductService.getInstance()
			.fetchEntitledProductsByName(partNames, effectiveAccountId);

		if (entitledPartIds.isEmpty()) {
			return new List<ProductService.SimpleProduct>();
		}

		ProductService productService = ProductService.getInstance();

		Map<Id, List<ProductCategory>> categoriesByProduct = EntitledProductService.getInstance()
			.fetchProductCategories(entitledPartIds);

		List<ProductService.SimpleProduct> parts = productService.getSimpleProducts(
			webstoreId,
			entitledPartIds,
			effectiveAccountId,
			categoriesByProduct
		);

		return parts;

	}

	public List<ProductService.SimpleProduct> fetchPartsFor(Id assetId) {
		Id storeId = BuyerService.currentWebStoreId;
		Id effectiveAccountId = BuyerService.effectiveAccountId;

		return fetchPartsFor(assetId, storeId, effectiveAccountId);
	}

	public Set<Id> sharedDealers(Id accountId) {
				return new Map<Id, Account>([
			SELECT Id
			FROM Account
			WHERE ParentId = :accountId
			OR Id = :accountId
		]).keySet().clone();
	}

	private Set<String> makePartsCallout(Asset asset) {
		switch on asset.Part_Class__c {
			when 'FGCV' {
				String vin = asset.VIN_Serial_Number__c;
				return PartsCalloutService.getInstance().fetchPartsWav(vin);
			}
			when else {
				String serialNumber = asset.VIN_Serial_Number__c;
				String serialPartNumber = asset.Product2.Name;

				return PartsCalloutService.getInstance().fetchPartsLift(serialNumber, serialPartNumber);
			}
		}
	}

	public class WarrantyRegistrationCheck {
		private Set<Id> assetIds;
		private Map<Id, Integer> warrantiesCount;

		public WarrantyRegistrationCheck(Set<Id> assetIds) {
			this.assetIds = assetIds;
			this.getWarrantiesCount();
		}

		public Boolean isRegistered(Id assetID){
			return Optional.of(this.warrantiesCount.get(assetID), 0) > 0;
		}

		private void getWarrantiesCount() {
			List<AggregateResult> aggregateResults = WithoutSharing.doAggregate(
				new Query(Entitlement.SObjectType)
					.addConditionIn(Entitlement.AssetId, assetIds)
					.selectField('AssetId')
					.groupBy('AssetId')
					.count('Id', 'warranties')
			);

			warrantiesCount = new Map<Id, Integer>();

			for(AggregateResult aggregateResult : aggregateResults){
				Id assetID = (Id) aggregateResult.get('AssetId');
				Integer warrantyCount = (Integer) aggregateResult.get('warranties');
				warrantiesCount.put(assetID, warrantyCount);
			}
		}
	}

}
