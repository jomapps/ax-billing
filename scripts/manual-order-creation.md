# Manual Order Creation for Testing

If the automated scripts aren't working, you can manually create test data through the PayloadCMS admin interface:

## Step 1: Access Admin Interface
Go to: http://localhost:3000/admin

## Step 2: Create a User (Customer)
1. Navigate to "Users" collection
2. Click "Create New"
3. Fill in:
   - Email: test.customer@example.com
   - Password: password123
   - Role: customer
   - First Name: Test
   - Last Name: Customer
   - WhatsApp Number: +60123456999
4. Save

## Step 3: Create a Vehicle
1. Navigate to "Vehicles" collection
2. Click "Create New"
3. Fill in:
   - License Plate: TEST123
   - Make: Toyota
   - Model: Camry
   - Year: 2020
   - Color: White
   - Owner: Select the user created in Step 2
4. Save

## Step 4: Create an Initiated Order
1. Navigate to "Orders" collection
2. Click "Create New"
3. Fill in the CRITICAL fields:
   - Order ID: AX-TEST-001
   - Customer: Select the user created in Step 2
   - Vehicle: Select the vehicle created in Step 3
   - WhatsApp Number: +60123456999
   - **QR Code Generated: CHECK THIS BOX** ✅
   - QR Code Scanned At: Set to current date/time
   - WhatsApp Linked: CHECK THIS BOX ✅
   - Total Amount: 25
   - Payment Status: pending
   - Overall Status: initiated
   - Queue: regular
4. Save

## Step 5: Test the Initiated Orders View
1. Go back to the main dashboard: http://localhost:3000
2. Click "View Initiated" button
3. You should see the order with proper customer name "Test Customer"

## Key Points:
- **qrCodeGenerated MUST be true** for orders to appear in the Initiated Orders view
- **Customer relationship** must be properly linked to show names instead of "Unknown Customer"
- **depth=2** in the API call ensures customer data is populated

## If Customer Names Still Show "Unknown Customer":
1. Check that the customer relationship is properly set in the order
2. Verify the customer has firstName and lastName fields populated
3. Check browser console for any API errors
4. Verify the API call includes depth=2 parameter
