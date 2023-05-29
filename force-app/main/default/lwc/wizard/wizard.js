


import { LightningElement, api, track } from 'lwc';

export default class Wizard extends LightningElement {

    @api variant = 'base';
    @api previousLabel = 'Previous';
    @api nextLabel = 'Next';
    @api finishLabel = 'Finish';
    @api header = '';
    @api showProgressIndicator;
    @api showTabs;
    @track _currentStep = null;

    @api get currentStep() {
        return this._currentStep;
    }

    set currentStep(value) {
        this.setAttribute('current-step', value);
        this._currentStep = value;
        this.setActiveStep();
    }

    @track steps = {};
    @track hasError = false;
    @track errorMessages = '';
    @track flow = [];

    isInit = false;
    progressIndicatorType = 'base';
    progressIndicatorVariant = 'base';

    connectedCallback() {
        this.init();
    }

    errorCallback(error, stack) {
        this.hasError = true;
        this.errorMessages = error + ' ' + stack;
    }

    slotChange() {
        this.configSteps();
        this.setActiveStep();
    }

    /**
     * Register a wizard step defined in component template
     *
     * @param {CustomEvent} event
     * @param {Object} event.detail
     * @param {*} event.detail.for Defines a list of steps on which this action will be available
     * @param {Object} event.detail.methods WizardAction Private API
     * @param {function} event.detail.methods.setActive Marks the step as current
    */

    registerStep(event) {
        var step = event.detail;
        this.steps[event.detail.name] = step;
        step.methods.config({
            labels: {
                next: this.nextLabel,
                previous: this.previousLabel,
                finish: this.finishLabel
            },
            callbacks: {
                unregister: this.unregisterStep.bind(this),
                move: this.moveStep.bind(this)
            }
        });
    }

    init() {
        if (this.isInit) {
            return;
        }
        this.isInit = true;
        switch (this.variant) {
            case 'base-shaded':
                this.progressIndicatorVariant = 'shaded';
                this.progressIndicatorType = 'base';
                break;
            case 'path':
                this.progressIndicatorVariant = 'base';
                this.progressIndicatorType = 'path';
                break;
            default:
                this.progressIndicatorVariant = 'base';
                this.progressIndicatorType = 'base';
        }
    }

    unregisterStep(stepName) {
        delete this.steps[stepName];
    }

    setActiveStep(stepName) {
        var self = this;

        if (stepName) {
            self.dispatchEvent(new CustomEvent('change', {
                detail: {
                    oldStep: self._currentStep,
                    currentStep: stepName
                }
            }));

            self._currentStep = stepName;
        }

        Object.values(self.steps).forEach(function(step) {
            step.methods.setActive(step.name === self._currentStep);
        });

    }

    configSteps() {
        var stepComponents = this.querySelectorAll('c-wizard-step'),
            self = this;

        this.flow = Array.prototype.map.call(stepComponents, (step, index) => {
            self.steps[step.name].methods.config({
                isFirst: index === 0,
                isLast: index === (stepComponents.length - 1)
            })

            return self.steps[step.name];
        });

        if (!this.currentStep && this.flow) {
            this.currentStep = this.flow[0].name;
        }
    }

    get flowSteps(){
        return this.flow.map(step => {
            step.isActive = this.currentStep === step.name;
            const commonClass = 'tab-header slds-tabs_default__item';
            const activeClass = commonClass + ' slds-is-active';

            step.class = step.isActive ? activeClass : commonClass;

            return step;
        })
    }

    async moveStep(direction) {
        let currentStep = this.steps[this._currentStep];
        let currentStepIndex = this.flow.indexOf(currentStep);

        if (direction === 'next') {
            this.hasError = !(await this.beforeChange(this.steps[this._currentStep]));

            if (!this.hasError) {
                let newStep = this.flow[currentStepIndex + 1];

                if (newStep) {
                    this.setActiveStep(newStep.name);
                } else {
                    this.dispatchEvent(new CustomEvent('complete'));
                }
            }
        } else {
            let newStep = this.flow[currentStepIndex - 1];

            if (newStep) {
                this.setActiveStep(newStep.name);
            }
        }
    }

    beforeChange(step) {
        return new Promise((resolve) => {
            if (!step.methods.beforeChange) {
                return resolve(true);
            }

            return resolve(step.methods.beforeChange());
        });
    }

}
