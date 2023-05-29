
@IsTest
private class AssetService_TEST {

	@IsTest
	static void testFetchAssetDetails() {
		// given
		Account account = (Account) new b2btd.xAccount()
			.withAddress()
			.persist();

		Product2 testProduct = (Product2) new b2btd.xProduct().persist();

		Asset testAsset = (Asset) new b2btd.xAsset()
			.vin('1234567890ABCDEF')
			.withProduct(testProduct.Id)
			.withAccount(account.Id)
			.getRecord();
		testAsset.PurchaseDate = Date.today();

		insert testAsset;

		// when
		Asset fetchedAsset = AssetService.getInstance().fetchAssetDetails(testAsset.Id);

		// then
		System.assertEquals(testAsset.Id, fetchedAsset.Id);
	}

	@IsTest
	static void testFetchPartsFor() {
		// given
		String vinNumber = '1234567890ABCDEF';
		Account account = (Account) new b2btd.xAccount()
			.withAddress()
			.persist();

		WebStore store = (WebStore) new b2btd.xWebstore().persist();

		Product2 wavProduct = (Product2) new b2btd.xProduct()
			.name('wav_product')
			.getRecord();
		wavProduct.acCore__PartClass__c = 'FGCV';
		insert wavProduct;

		Asset testAsset = (Asset) new b2btd.xAsset()
			.vin(vinNumber)
			.withProduct(wavProduct.Id)
			.withAccount(account.Id)
			.getRecord();
		testAsset.PurchaseDate = Date.today();

		insert testAsset;


		Set<String> productNames = new Set<String>{
			wavProduct.Id
		};

		DI.Mock mock = DI.mock(PartsCalloutService.class);
		mock.startStubbing();
		mock.when(PartsCalloutService.getInstance().fetchPartsWav(vinNumber)).thenReturn(productNames);
		mock.stopStubbing();

		Set<Id> productIds = new Set<Id>{
			wavProduct.Id
		};
		Map<Id, List<ProductCategory>> categories = new Map<Id, List<ProductCategory>>();

		mock = DI.mock(EntitledProductService.class);
		mock.startStubbing();
		mock.when(EntitledProductService.getInstance().fetchEntitledProductsByName(productNames, account.Id)).thenReturn(productIds);
		mock.when(EntitledProductService.getInstance().fetchProductCategories(productIds)).thenReturn(categories);
		mock.stopStubbing();

		mock = DI.mock(BuyerContext.class);
		mock.startStubbing();
		mock.when(BuyerContext.getInstance().getEffectiveAccount()).thenReturn(account);
		mock.when(BuyerContext.getInstance().getWebstore()).thenReturn(store);
		mock.stopStubbing();

		List<ProductService.SimpleProduct> expectedOutput = new List<ProductService.SimpleProduct>();

		mock = DI.mock(ProductService.class);
		mock.startStubbing();
		mock.when(ProductService.getInstance().getSimpleProducts(
			store.Id,
			productIds,
			account.Id,
			categories
		)).thenReturn(expectedOutput);
		mock.stopStubbing();

		// when
		List<ProductService.SimpleProduct> actualOutput = AssetService.getInstance().fetchPartsFor(testAsset.Id);

		// then
		System.assertEquals(expectedOutput, actualOutput);
	}

	@IsTest
	public static void testFetchAssets() {
		// given
		Account dealerAccount = (Account) new b2btd.xAccount()
			.ofTypeDealer()
			.persist();

		Product2 product = (Product2) new b2btd.xProduct().persist();
		Product2 product2 = (Product2) new b2btd.xProduct()
			.name('test product 2')
			.persist();


		Asset assetWithoutWarranty = (Asset) new b2btd.xAsset()
			.name('Asset Without Warranty')
			.dealer(dealerAccount.Id)
			.withAccount(dealerAccount.Id)
			.unregistered()
			.withProduct(product.Id)
			.getRecord();

		System.debug('without' + assetWithoutWarranty);

		Asset assetWithWarranty = (Asset) new b2btd.xAsset()
			.name('Asset With Warranty')
			.dealer(dealerAccount.Id)
			.withAccount(dealerAccount.Id)
			.unregistered()
			.withProduct(product2.Id)
			.getRecord();

		System.debug('with' + assetWithWarranty);

		insert new List<Asset>{
			assetWithoutWarranty, assetWithWarranty
		};


		System.debug([SELECT Name, Id, Selling_Dealer__c, AccountId FROM Asset]);

		Entitlement testWarranty = (Entitlement) new b2btd.xEntitlement()
			.productType('Lifts')
			.account(dealerAccount.Id)
			.dealer(dealerAccount.Id) // FYI There is a process Builder that is changing dealer on asset to warranty dealer
			.asset(assetWithWarranty.Id)
			.persist();

		System.debug([SELECT Name, Id, Selling_Dealer__c, AccountId FROM Asset]);

		// when
		List<Asset> foundAssets = AssetService.getInstance().fetchAssetsForAccount(dealerAccount.Id);

		// then
		System.assertEquals(2, foundAssets.size());
	}

	@IsTest
	static void isRegistered_Test(){
		// given
		String vinNumber = '1234567890ABCDEF';
		Account account = (Account) new b2btd.xAccount()
				.withAddress()
				.persist();

		WebStore store = (WebStore) new b2btd.xWebstore().persist();

		Product2 wavProduct = (Product2) new b2btd.xProduct()
				.name('wav_product')
				.getRecord();
		wavProduct.acCore__PartClass__c = 'FGCV';
		insert wavProduct;

		Asset testAsset = (Asset) new b2btd.xAsset()
				.vin(vinNumber)
				.withProduct(wavProduct.Id)
				.withAccount(account.Id)
				.getRecord();
		testAsset.PurchaseDate = Date.today();

		insert testAsset;

		//then
		Boolean result = AssetService.getInstance().isRegistered(testAsset.Id);

		//when
		System.assertEquals(false, result);
	}

}
