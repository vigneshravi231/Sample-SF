

import { LightningElement, api, track } from "lwc";
import groupByField from "@salesforce/apex/WavListViewController.groupByField";
import { deepClone } from "c/utils";

export default class ProductConfigurator extends LightningElement {
  @api configuration = [];
  @api isDealerLocate;

  @track isLoading = false;
  @track fields = [];
  @track sections = [];

  async connectedCallback() {
    this.sections = deepClone(this.configuration);

    this.sections.forEach(section => {
      this.sections.fields = section.fields.map(field => {
        return {
          ...field,
          value: "",
          options: [],
        };
      });
      this.fields.push(...section.fields);
    })

    try {
      await this.doFilter();
    } catch (err) {
      console.log("in error");
      console.log(err);
    }
  }

  get fieldsByName() {
    return this.fields.reduce((map, field) => ((map[field.name] = field), map), {});
  }

  enableCheckboxes() {
    const byName = this.fieldsByName;

    this.fields.forEach((field) => {
      const enable = field.dependsOn.every(fieldName => !!byName[fieldName].value);

      field.value = enable ? field.value : "";

      field.disabled = !enable;
    });
  }

  get selectedFilter() {
    return (this.fields || []).reduce((obj, field) => {
      obj[field.name] = field.value;
      return obj;
    }, {});
  }

  async doFilter(changedFilter) {
    this.isLoading = true;

    const dependsOnChangedFilter = this.fields.reduce((acc, field) => {
      return field.dependsOn.includes(changedFilter)
        ? [...acc, field.name]
        : [...acc];
    }, []);

    this.fields.forEach(field => {
      field.value = dependsOnChangedFilter.includes(field.name)
        ? ""
        : field.value;
    });

    console.log(this.isDealerLocate, 'is dealer locate field');

    const response = await Promise.all(
      this.fields.map((field) =>
        groupByField({ field: field.name, filter: this.selectedFilter, forDealerLocate: !!this.isDealerLocate })
      )
    );

    console.log("res all", response);


    this.fields.forEach((field, idx) => {
      const excludeOptions = field.excludeOptions || [];
      const newValues = response[idx].filter(option => !excludeOptions.includes(option))

      if (!changedFilter || dependsOnChangedFilter.includes(field.name)) {
        field.options = newValues;
      }
    });

    this.enableCheckboxes();
    this.isLoading = false;
  }

  async handleFilterChange(event) {
    let { name, value } = event.detail;

    const field = this.fields.find((f) => f.name === name);
    field.value = value;

    console.log("custom change", name, value, field.priority);

    await this.doFilter(name);

    console.log(JSON.parse(JSON.stringify(this.fields)));

    this.dispatchConfigChange();
  }

  dispatchConfigChange() {
    this.dispatchEvent(
      new CustomEvent("configchange", { detail: this.selectedFilter })
    );
  }
}
