"use client";

import { useEffect, useRef } from "react";

export default function RazorpayPaymentButton() {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!formRef.current || formRef.current.querySelector("script")) return;

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/payment-button.js";
    script.setAttribute("data-payment_button_id", "pl_T7Jqphm1WeJAYj");
    script.async = true;

    formRef.current.appendChild(script);
  }, []);

  return <form ref={formRef} />;
}
