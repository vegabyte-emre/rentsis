"""
iyzico Payment Gateway Integration Service
Handles subscription payments for the SaaS platform
"""

import os
import hmac
import hashlib
import base64
import httpx
import json
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from uuid import uuid4
import logging

logger = logging.getLogger(__name__)

class IyzicoService:
    """Service class for iyzico payment gateway operations"""
    
    def __init__(self):
        self.api_key = os.getenv("IYZICO_API_KEY", "")
        self.secret_key = os.getenv("IYZICO_SECRET_KEY", "")
        self.base_url = os.getenv("IYZICO_BASE_URL", "https://sandbox-api.iyzipay.com")
        self.is_configured = bool(self.api_key and self.secret_key)
    
    def _generate_signature(self, request_body: str) -> str:
        """Generate HMAC-SHA256 signature for request authentication"""
        signature = hmac.new(
            self.secret_key.encode('utf-8'),
            request_body.encode('utf-8'),
            hashlib.sha256
        ).digest()
        return base64.b64encode(signature).decode('utf-8')
    
    def _get_auth_header(self, request_body: str) -> str:
        """Generate IYZWSv2 authorization header"""
        signature = self._generate_signature(request_body)
        auth_string = f"{self.api_key}:{signature}"
        encoded = base64.b64encode(auth_string.encode('utf-8')).decode('utf-8')
        return f"IYZWSv2 {encoded}"
    
    async def create_checkout_form(
        self,
        price: float,
        paid_price: float,
        basket_id: str,
        buyer: Dict[str, Any],
        shipping_address: Dict[str, Any],
        billing_address: Dict[str, Any],
        basket_items: list,
        callback_url: str,
        currency: str = "TRY"
    ) -> Dict[str, Any]:
        """
        Create iyzico checkout form for one-time payment
        """
        if not self.is_configured:
            return {"status": "error", "message": "iyzico API keys not configured"}
        
        conversation_id = str(uuid4())
        
        payload = {
            "locale": "tr",
            "conversationId": conversation_id,
            "price": str(price),
            "paidPrice": str(paid_price),
            "currency": currency,
            "basketId": basket_id,
            "paymentGroup": "SUBSCRIPTION",
            "callbackUrl": callback_url,
            "enabledInstallments": [1, 2, 3, 6, 9],
            "buyer": buyer,
            "shippingAddress": shipping_address,
            "billingAddress": billing_address,
            "basketItems": basket_items
        }
        
        request_body = json.dumps(payload, ensure_ascii=False)
        auth_header = self._get_auth_header(request_body)
        
        headers = {
            "Authorization": auth_header,
            "Content-Type": "application/json"
        }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/payment/iyzipos/checkoutform/initialize/auth/ecom",
                    content=request_body,
                    headers=headers
                )
                result = response.json()
                result["conversationId"] = conversation_id
                return result
        except Exception as e:
            logger.error(f"iyzico checkout form error: {str(e)}")
            return {"status": "error", "message": str(e)}
    
    async def retrieve_checkout_result(
        self,
        token: str
    ) -> Dict[str, Any]:
        """
        Retrieve checkout result after payment completion
        """
        if not self.is_configured:
            return {"status": "error", "message": "iyzico API keys not configured"}
        
        conversation_id = str(uuid4())
        
        payload = {
            "locale": "tr",
            "conversationId": conversation_id,
            "token": token
        }
        
        request_body = json.dumps(payload, ensure_ascii=False)
        auth_header = self._get_auth_header(request_body)
        
        headers = {
            "Authorization": auth_header,
            "Content-Type": "application/json"
        }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/payment/iyzipos/checkoutform/auth/ecom/detail",
                    content=request_body,
                    headers=headers
                )
                return response.json()
        except Exception as e:
            logger.error(f"iyzico checkout result error: {str(e)}")
            return {"status": "error", "message": str(e)}
    
    async def create_subscription_product(
        self,
        name: str,
        description: str = ""
    ) -> Dict[str, Any]:
        """
        Create a subscription product in iyzico
        """
        if not self.is_configured:
            return {"status": "error", "message": "iyzico API keys not configured"}
        
        conversation_id = str(uuid4())
        reference_code = f"PROD_{str(uuid4())[:8].upper()}"
        
        payload = {
            "locale": "tr",
            "conversationId": conversation_id,
            "name": name,
            "description": description,
            "referenceCode": reference_code
        }
        
        request_body = json.dumps(payload, ensure_ascii=False)
        auth_header = self._get_auth_header(request_body)
        
        headers = {
            "Authorization": auth_header,
            "Content-Type": "application/json"
        }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/v2/subscription/products",
                    content=request_body,
                    headers=headers
                )
                return response.json()
        except Exception as e:
            logger.error(f"iyzico subscription product error: {str(e)}")
            return {"status": "error", "message": str(e)}
    
    async def create_pricing_plan(
        self,
        product_reference_code: str,
        name: str,
        price: float,
        currency: str = "TRY",
        payment_interval: str = "MONTHLY",  # MONTHLY, WEEKLY, YEARLY
        payment_interval_count: int = 1,
        trial_period_days: int = 0
    ) -> Dict[str, Any]:
        """
        Create a pricing plan for subscription
        """
        if not self.is_configured:
            return {"status": "error", "message": "iyzico API keys not configured"}
        
        conversation_id = str(uuid4())
        reference_code = f"PLAN_{str(uuid4())[:8].upper()}"
        
        payload = {
            "locale": "tr",
            "conversationId": conversation_id,
            "productReferenceCode": product_reference_code,
            "name": name,
            "price": str(price),
            "currencyCode": currency,
            "paymentInterval": payment_interval,
            "paymentIntervalCount": payment_interval_count,
            "trialPeriodDays": trial_period_days,
            "planPaymentType": "RECURRING",
            "referenceCode": reference_code
        }
        
        request_body = json.dumps(payload, ensure_ascii=False)
        auth_header = self._get_auth_header(request_body)
        
        headers = {
            "Authorization": auth_header,
            "Content-Type": "application/json"
        }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/v2/subscription/pricing-plans",
                    content=request_body,
                    headers=headers
                )
                return response.json()
        except Exception as e:
            logger.error(f"iyzico pricing plan error: {str(e)}")
            return {"status": "error", "message": str(e)}
    
    async def initialize_subscription_checkout(
        self,
        pricing_plan_reference_code: str,
        customer: Dict[str, Any],
        callback_url: str
    ) -> Dict[str, Any]:
        """
        Initialize subscription checkout form
        """
        if not self.is_configured:
            return {"status": "error", "message": "iyzico API keys not configured"}
        
        conversation_id = str(uuid4())
        
        payload = {
            "locale": "tr",
            "conversationId": conversation_id,
            "pricingPlanReferenceCode": pricing_plan_reference_code,
            "subscriptionInitialStatus": "ACTIVE",
            "callbackUrl": callback_url,
            "customer": customer
        }
        
        request_body = json.dumps(payload, ensure_ascii=False)
        auth_header = self._get_auth_header(request_body)
        
        headers = {
            "Authorization": auth_header,
            "Content-Type": "application/json"
        }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/v2/subscription/checkoutform/initialize",
                    content=request_body,
                    headers=headers
                )
                result = response.json()
                result["conversationId"] = conversation_id
                return result
        except Exception as e:
            logger.error(f"iyzico subscription checkout error: {str(e)}")
            return {"status": "error", "message": str(e)}
    
    async def cancel_subscription(
        self,
        subscription_reference_code: str
    ) -> Dict[str, Any]:
        """
        Cancel an active subscription
        """
        if not self.is_configured:
            return {"status": "error", "message": "iyzico API keys not configured"}
        
        conversation_id = str(uuid4())
        
        payload = {
            "locale": "tr",
            "conversationId": conversation_id,
            "subscriptionReferenceCode": subscription_reference_code
        }
        
        request_body = json.dumps(payload, ensure_ascii=False)
        auth_header = self._get_auth_header(request_body)
        
        headers = {
            "Authorization": auth_header,
            "Content-Type": "application/json"
        }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/v2/subscription/subscriptions/{subscription_reference_code}/cancel",
                    content=request_body,
                    headers=headers
                )
                return response.json()
        except Exception as e:
            logger.error(f"iyzico subscription cancel error: {str(e)}")
            return {"status": "error", "message": str(e)}
    
    def verify_webhook_signature(self, payload: bytes, signature_header: str) -> bool:
        """
        Verify webhook signature from iyzico
        """
        if not self.is_configured:
            return False
        
        expected_signature = hmac.new(
            self.secret_key.encode('utf-8'),
            payload,
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(signature_header or "", expected_signature)


# Singleton instance
iyzico_service = IyzicoService()
