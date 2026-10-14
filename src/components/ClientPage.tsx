import React from 'react';
import { ClientPortal } from './ClientPortal';

interface ClientPageProps {
  onEnquirySubmitted?: (enquiryData: {
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    projectType: string;
    location: string;
    budget: string;
    notes: string;
  }) => void;
  onReturnToWorkspace?: () => void;
  isPreviewMode?: boolean;
}

export const ClientPage: React.FC<ClientPageProps> = (props) => {
  return <ClientPortal {...props} />;
};

export default ClientPage;
