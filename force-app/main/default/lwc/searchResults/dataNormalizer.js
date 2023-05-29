export function transformData(data, cardContentMapping) {
    const DEFAULT_PAGE_SIZE = 20;
    const { productsPage = {}, categories = {}, facets = [], locale = '' } =
        data || {};
    const {
        currencyIsoCode = '',
        total = 0,
        products = [],
        pageSize = DEFAULT_PAGE_SIZE
    } = productsPage;

    return {
        locale,
        total,
        pageSize,
        categoriesData: categories,
        facetsData: facets.map(
            ({
                nameOrId,
                attributeType,
                facetType: type,
                displayType,
                displayName,
                displayRank,
                values
            }) => {
                return {
                    id: `${nameOrId}:${attributeType}`,
                    nameOrId,
                    attributeType,
                    type,
                    displayType,
                    displayName,
                    displayRank,
                    values: values.map((v) => ({ ...v, checked: false }))
                };
            }
        ),
        layoutData: products.map(
            ({ id, name, defaultImage, fields, prices }) => {
                defaultImage = defaultImage || {};
                const { unitPrice: negotiatedPrice, listPrice: listingPrice } =
                    prices || {};

                return {
                    id,
                    name,
                    fields: normalizedCardContentMapping(cardContentMapping)
                        .map((mapFieldName) => ({
                            name: mapFieldName,
                            value:
                                (fields[mapFieldName] &&
                                    fields[mapFieldName].value) ||
                                ''
                        }))
                        .filter(({ value }) => !!value),
                    image: {
                        url: defaultImage.url,
                        title: defaultImage.title || '',
                        alternateText: defaultImage.alternateText || ''
                    },
                    prices: {
                        listingPrice,
                        negotiatedPrice,
                        currencyIsoCode
                    }
                };
            }
        )
    };
}

export function normalizedCardContentMapping(cardContentMapping) {
    return (cardContentMapping || 'Name').split(',');
}
