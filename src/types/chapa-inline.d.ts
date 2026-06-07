export {};

declare global {
  interface Window {
    ChapaCheckout?: new (options: {
      publicKey: string;
      amount: string;
      currency?: string;
      tx_ref: string;
      mobile?: string;
      callbackUrl?: string;
      returnUrl?: string;
      availablePaymentMethods?: string[];
      showFlag?: boolean;
      showPaymentMethodsNames?: boolean;
      customizations?: {
        buttonText?: string;
        successMessage?: string;
        styles?: string;
      };
      onSuccessfulPayment?: (response: unknown, reference: string) => void;
      onPaymentFailure?: (message: string) => void;
      onClose?: () => void;
    }) => {
      initialize: (containerId?: string) => void;
    };
  }
}
