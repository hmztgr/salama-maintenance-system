'use client';

import { useState } from 'react';
import {
  CustomerCreationState,
  CustomerCreationStep,
  MultiStepCustomerData,
  CustomerBasicInfo,
  ContractInfo,
  BranchInfo
} from '@/types/customer';
import { CustomerBasicInfoStep } from './steps/CustomerBasicInfoStep';
import { ContractInfoStep } from './steps/ContractInfoStep';
import { BranchInfoStep } from './steps/BranchInfoStep';
import { ReviewStep } from './steps/ReviewStep';

export interface MultiStepCustomerFormProps {
  onComplete: (data: MultiStepCustomerData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const initialCustomerData: MultiStepCustomerData = {
  basicInfo: {
    companyName: '',
    unifiedNumber: '',
    commercialRegistration: '',
    vatNumber: '',
    email: '',
    phone: '',
    mobile: '',
    address: '',
    website: '',
    contactPerson: '',
    contactPersonTitle: '',
    notes: '',
  },
  contracts: [],
  branches: [],
};

export function MultiStepCustomerForm({
  onComplete,
  onCancel,
  isLoading = false
}: MultiStepCustomerFormProps) {
  const [state, setState] = useState<CustomerCreationState>({
    currentStep: 'basic',
    data: initialCustomerData,
    isEditing: false,
  });

  const steps: Array<{
    id: CustomerCreationStep;
    title: string;
    description: string;
    isComplete: boolean;
  }> = [
    {
      id: 'basic',
      title: 'معلومات الشركة',
      description: 'البيانات الأساسية والتراخيص',
      isComplete: !!state.data.basicInfo.companyName,
    },
    {
      id: 'contract',
      title: 'بيانات العقود والفروع',
      description: 'تفاصيل العقود وخدمات السلامة والفروع المرتبطة',
      isComplete: state.data.contracts.length > 0 && state.data.contracts.every(c => c.branches && c.branches.length > 0),
    },
    {
      id: 'review',
      title: 'مراجعة البيانات',
      description: 'مراجعة نهائية قبل الحفظ',
      isComplete: false,
    },
  ];

  const currentStepIndex = steps.findIndex(step => step.id === state.currentStep);

  const handleStepComplete = (stepData: CustomerBasicInfo | ContractInfo | BranchInfo[]) => {
    setState(prev => {
      const newData = { ...prev.data };

      switch (prev.currentStep) {
        case 'basic':
          newData.basicInfo = stepData as CustomerBasicInfo;
          break;
        case 'contract':
          if (prev.editingContractId) {
            // Editing existing contract
            newData.contracts = newData.contracts.map(contract =>
              contract.id === prev.editingContractId ? stepData as ContractInfo : contract
            );
          } else {
            // Adding new contract
            newData.contracts = [...newData.contracts, stepData as ContractInfo];
          }
          break;
        case 'branches':
          // Update the current contract's branches
          if (prev.editingContractId) {
            newData.contracts = newData.contracts.map(contract =>
              contract.id === prev.editingContractId
                ? { ...contract, branches: stepData as BranchInfo[] }
                : contract
            );
          }
          break;
      }

      // Determine next step
      let nextStep: CustomerCreationStep;
      if (prev.currentStep === 'basic') {
        nextStep = 'contract';
      } else if (prev.currentStep === 'contract') {
        // After saving a contract, go directly to review
        nextStep = 'review';
      } else if (prev.currentStep === 'branches') {
        nextStep = 'review';
      } else {
        nextStep = 'review';
      }

      return {
        ...prev,
        currentStep: nextStep,
        data: newData,
        editingContractId: undefined,
      };
    });
  };

  const handleReviewComplete = (finalData: MultiStepCustomerData) => {
    onComplete(finalData);
  };

  const handleStepBack = () => {
    setState(prev => {
      let prevStep: CustomerCreationStep;
      if (prev.currentStep === 'contract') {
        prevStep = 'basic';
      } else if (prev.currentStep === 'branches') {
        prevStep = 'contract';
      } else if (prev.currentStep === 'review') {
        prevStep = 'branches';
      } else {
        prevStep = 'basic';
      }

      return {
        ...prev,
        currentStep: prevStep,
        editingContractId: undefined,
      };
    });
  };

  const handleGoToStep = (step: CustomerCreationStep) => {
    setState(prev => ({
      ...prev,
      currentStep: step,
      editingContractId: undefined,
    }));
  };

  const handleAddAnotherContract = () => {
    setState(prev => ({
      ...prev,
      currentStep: 'contract',
      editingContractId: undefined,
    }));
  };

  const handleEditContract = (contractId: string) => {
    setState(prev => ({
      ...prev,
      currentStep: 'contract',
      editingContractId: contractId,
    }));
  };

  const renderCurrentStep = () => {
    switch (state.currentStep) {
      case 'basic':
        return (
          <CustomerBasicInfoStep
            data={state.data.basicInfo}
            onComplete={handleStepComplete}
            onCancel={onCancel}
            isLoading={isLoading}
          />
        );
      case 'contract':
        const editingContract = state.editingContractId
          ? state.data.contracts.find(c => c.id === state.editingContractId)
          : undefined;
        return (
          <ContractInfoStep
            data={editingContract}
            onComplete={handleStepComplete}
            onBack={handleStepBack}
            isLoading={isLoading}
            isEditing={!!state.editingContractId}
          />
        );
      case 'branches':
        // This step is now handled within contracts, redirect to review
        return (
          <ReviewStep
            data={state.data}
            onComplete={handleReviewComplete}
            onBack={handleStepBack}
            onEdit={handleGoToStep}
            onAddContract={handleAddAnotherContract}
            onEditContract={handleEditContract}
            isLoading={isLoading}
          />
        );
      case 'review':
        return (
          <ReviewStep
            data={state.data}
            onComplete={handleReviewComplete}
            onBack={handleStepBack}
            onEdit={handleGoToStep}
            onAddContract={handleAddAnotherContract}
            onEditContract={handleEditContract}
            isLoading={isLoading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  step.id === state.currentStep
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : step.isComplete
                      ? 'border-green-600 bg-green-600 text-white'
                      : 'border-gray-300 bg-white text-gray-300'
                }`}>
                  {step.isComplete ? '✓' : index + 1}
                </div>
                <div className="mr-3">
                  <div className={`text-sm font-medium ${
                    step.id === state.currentStep ? 'text-blue-600' :
                    step.isComplete ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </div>
                  <div className="text-xs text-gray-500">{step.description}</div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-0.5 mx-4 ${
                    step.isComplete ? 'bg-green-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Current Step Content */}
        <div className="bg-white rounded-lg shadow-lg">
          {renderCurrentStep()}
        </div>
      </div>
    </div>
  );
}

// Safe default props
MultiStepCustomerForm.defaultProps = {
  isLoading: false,
};
