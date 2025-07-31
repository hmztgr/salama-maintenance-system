'use client';
import { useCallback } from 'react';
import { useContractsFirebase } from './useContractsFirebase';
import { useAuth } from '@/contexts/AuthContextFirebase';
import { Contract, ContractHistoryEntry } from '@/types/customer';
import { generateContractId } from '@/lib/id-generator';
import { getCurrentDate, addDays, addMonths, parseStandardDate, formatDateForDisplay } from '@/lib/date-handler';

export function useContractRenewal() {
  const { addContract, updateContract } = useContractsFirebase();
  const { authState } = useAuth();

  // Calculate contract duration in months
  const getContractDuration = useCallback((contract: Contract): number => {
    if (contract.contractPeriodMonths) {
      return contract.contractPeriodMonths;
    }
    
    const startDate = parseStandardDate(contract.contractStartDate);
    const endDate = parseStandardDate(contract.contractEndDate);
    
    // Check if both dates are valid
    if (!startDate || !endDate) {
      return 12; // Default to 12 months if dates are invalid
    }
    
    const diffTime = endDate.getTime() - startDate.getTime();
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30.44)); // Average days per month
    return diffMonths;
  }, []);

  // Renew contract with automatic date calculation
  const renewContract = useCallback(async (
    contract: Contract, 
    withChanges: boolean = false
  ): Promise<{ success: boolean; newContract?: Contract; error?: string }> => {
    try {
      if (!authState.user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Calculate new contract dates
      const currentEndDate = parseStandardDate(contract.contractEndDate);
      if (!currentEndDate) {
        return { success: false, error: 'Invalid contract end date' };
      }
      
      const newStartDate = addDays(formatDateForDisplay(currentEndDate), 1); // Start from next day
      const contractDuration = getContractDuration(contract);
      const newEndDate = addMonths(newStartDate, contractDuration);

      // Create new contract with copied data
      const newContractData: Omit<Contract, 'id' | 'contractId' | 'isArchived' | 'createdAt' | 'updatedAt'> = {
        companyId: contract.companyId,
        contractStartDate: formatDateForDisplay(newStartDate),
        contractEndDate: formatDateForDisplay(newEndDate),
        contractPeriodMonths: contract.contractPeriodMonths,
        contractDocument: contract.contractDocument,
        contractValue: contract.contractValue,
        notes: contract.notes,
        serviceBatches: contract.serviceBatches,
        
        // Advanced Contract Management fields
        status: 'active',
        isRenewed: true,
        originalContractId: contract.contractId,
        addendums: [],
        contractHistory: [
          {
            action: 'renewed',
            timestamp: getCurrentDate(),
            performedBy: authState.user.email || 'system',
            description: 'Contract renewed from previous contract',
            details: {
              originalContractId: contract.contractId,
              renewalDate: getCurrentDate()
            }
          }
        ]
      };

      // Add new contract
      const result = await addContract(newContractData);
      
      if (result.success && result.contract) {
        // Archive original contract
        await archiveContract(contract.contractId, 'Contract renewed');
        
        return { 
          success: true, 
          newContract: result.contract 
        };
      } else {
        return { 
          success: false, 
          error: result.warnings?.join(', ') || 'Failed to create new contract' 
        };
      }
    } catch (error) {
      console.error('Error renewing contract:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }, [authState.user, addContract, getContractDuration]);

  // Archive contract
  const archiveContract = useCallback(async (
    contractId: string, 
    reason: string = 'Contract archived'
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!authState.user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Get current contract
      const { contracts } = useContractsFirebase();
      const contract = contracts.find(c => c.contractId === contractId);
      
      if (!contract) {
        return { success: false, error: 'Contract not found' };
      }

      // Update contract with archived status
      const updatedContract: Partial<Contract> = {
        status: 'archived',
        isArchived: true,
        archivedAt: getCurrentDate(),
        archivedBy: authState.user.email || 'system',
        archiveReason: reason,
        contractHistory: [
          ...contract.contractHistory,
          {
            action: 'archived',
            timestamp: getCurrentDate(),
            performedBy: authState.user.email || 'system',
            description: `Contract archived: ${reason}`,
            details: { archiveReason: reason }
          }
        ]
      };

      const result = await updateContract(contractId, updatedContract);
      return result;
    } catch (error) {
      console.error('Error archiving contract:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }, [authState.user, updateContract]);

  // Add addendum to contract
  const addContractAddendum = useCallback(async (
    contractId: string,
    addendumData: {
      services: {
        fireExtinguisherMaintenance: boolean;
        alarmSystemMaintenance: boolean;
        fireSuppressionMaintenance: boolean;
        gasFireSuppression: boolean;
        foamFireSuppression: boolean;
      };
      description: string;
      effectiveDate: string;
      contractValue: number;
      notes?: string;
    }
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!authState.user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Get current contract
      const { contracts } = useContractsFirebase();
      const contract = contracts.find(c => c.contractId === contractId);
      
      if (!contract) {
        return { success: false, error: 'Contract not found' };
      }

      // Create new addendum
      const newAddendum = {
        addendumId: `ADD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        addedAt: getCurrentDate(),
        addedBy: authState.user.email || 'system',
        services: addendumData.services,
        description: addendumData.description,
        effectiveDate: addendumData.effectiveDate,
        contractValue: addendumData.contractValue,
        notes: addendumData.notes
      };

      // Update contract with new addendum
      const updatedContract: Partial<Contract> = {
        addendums: [...contract.addendums, newAddendum],
        contractHistory: [
          ...contract.contractHistory,
          {
            action: 'addendum_added',
            timestamp: getCurrentDate(),
            performedBy: authState.user.email || 'system',
            description: `Addendum added: ${addendumData.description}`,
            details: { addendumId: newAddendum.addendumId }
          }
        ]
      };

      const result = await updateContract(contractId, updatedContract);
      return result;
    } catch (error) {
      console.error('Error adding contract addendum:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }, [authState.user, updateContract]);

  return {
    renewContract,
    archiveContract,
    addContractAddendum,
    getContractDuration
  };
} 