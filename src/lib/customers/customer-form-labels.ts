export type CustomerFormLabels = {
  name: string;
  namePlaceholder: string;
  phone: string;
  phonePlaceholder: string;
  email: string;
  emailPlaceholder: string;
  documentId: string;
  documentIdPlaceholder: string;
  address: string;
  addressPlaceholder: string;
  notes: string;
  notesPlaceholder: string;
  searchPlaceholder: string;
  noResults: string;
  selectedHint: string;
  emptySelection: string;
  picker: {
    title: string;
    description: string;
    addCustomer: string;
    addSuccess: string;
  };
};

export type CustomerFormDialogLabels = {
  customer: CustomerFormLabels;
  validation: {
    draftCustomerName: string;
    customers: string;
  };
  actions: {
    addCustomer: string;
    removeCustomer: string;
  };
};
