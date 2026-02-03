
export enum EnquiryType {
  GENERAL = 'GENERAL',
  SUPPORT = 'SUPPORT',
  SALES = 'SALES'
}

export interface Enquiry {
  id?: number;
  name: string;
  mobile: string;
  email: string;
  type: EnquiryType;
  message: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AIAnalysis {
  suggestedType: EnquiryType;
  refinement: string;
  sentiment: 'positive' | 'neutral' | 'frustrated';
}
