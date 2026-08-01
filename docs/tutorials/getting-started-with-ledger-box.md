# Getting started with Ledger Box

This tutorial walks you through Ledger Box as an end user. By the end you will have signed in, created wallets, recorded money in and out, transferred between wallets, attached a receipt, invited someone, shared a statement link, and reviewed the activity log.

Ledger Box answers one question: **how much is in this wallet, and can I account for it?** There are no spending categories — use the description field for anything you need to remember.

You need:

- A running Ledger Box app URL (for example `http://localhost:8888`)
- An email address for sign-in (or a Google account)

---

## 1. Sign in

1. Open the app in your browser.
2. If you do not have an account yet, go to `/auth/register`.
3. Enter your **Name**, **Email**, and **Password**, then submit — or choose **Continue with Google**.
4. If you already have an account, open `/auth/login`, enter your email and password (or **Continue with Google**), and choose **Log in**.

When sign-in succeeds you land in the app. If you have no wallets yet, you will see **No wallets yet**.

---

## 2. Create your first wallet

1. Choose **New wallet** (empty-state button, or the same action in the sidebar).
2. In the **New wallet** dialog, enter a name such as `Cash on hand`.
3. Choose **Create**.

You should see a success toast (**Wallet created**). The wallet appears in the sidebar with a balance of zero. Open it from the sidebar if it is not already open — the header shows the wallet name and **New balance**.

---

## 3. Record income and expense

### Add income

1. On the wallet page, choose **Add transaction**.
2. In **New Transaction**, select **Income**.
3. Enter an **Amount** (for example `1,000,000`).
4. In **Description**, write something clear, such as `Opening deposit from client`.
5. Leave **Date** empty to use today, or pick a date.
6. Choose **Add Transaction**.

Confirm the header balance increased by the amount you entered.

### Add an expense

1. Choose **Add transaction** again.
2. Select **Expense**.
3. Enter an amount smaller than the current balance (for example `150,000`).
4. Describe it (for example `Office supplies receipt`).
5. Choose **Add Transaction**.

Confirm the balance decreased. The transactions list and summary now show both entries.

---

## 4. Edit and delete a transaction

### Edit

1. Find the expense in the list.
2. Open its ⋮ menu and choose **Edit**.
3. Change the **Amount** or **Description** (type cannot be changed after creation).
4. Save the form.

Check the wallet balance: it should reverse the old amount and apply the new one.

### Delete

1. Open the ⋮ menu on a transaction you no longer need.
2. Choose **Delete**.
3. Confirm in the **Delete transaction?** dialog.

The row disappears and the balance updates as if that transaction never counted.

---

## 5. Attach a receipt

1. Open a transaction (click the row to open details).
2. Choose **Attachments**.
3. Use **Upload files** and pick a PDF or image (`PDF`, `PNG`, `JPG`, `JPEG`, or `WEBP`).
4. Wait until the upload finishes, then open the file to preview it.

You can remove an attachment from the same panel if you uploaded the wrong file. Deleting an attachment removes the file permanently.

---

## 6. Transfer between wallets

Transfers need two wallets.

1. In the sidebar, choose **New wallet** and create a second wallet (for example `Bank float`).
2. Open the first wallet (`Cash on hand`).
3. Choose **Transfer** (visible once you have more than one wallet).
4. In **Transfer Money**:
   - **From** is the current wallet
   - **To** — select `Bank float`
   - Enter an **Amount** and optional **Note**
5. Choose **Confirm Transfer**.

Open each wallet and confirm:

- The source wallet shows an expense and a lower balance
- The destination wallet shows matching income and a higher balance

Those two legs stay linked — treat them as one move of money, not two unrelated transactions.

---

## 7. Invite a member

1. On a wallet you own, open settings with the gear icon next to **Add transaction**.
2. Find the **Members** section.
3. Under **Invite by email**, enter a colleague’s email.
4. Choose a role:
   - **Viewer** — can see balances and transactions; cannot change money
   - **Manager** — can add, edit, and delete transactions (and related money actions); cannot delete the wallet or manage members / statement links
5. Choose **Invite**.

You should see **Invite sent**. When that person signs in with the same email, the invite activates and the wallet appears for them.

You can change a member’s role or remove them from the same list later. Only the wallet owner manages members.

---

## 8. Share a statement link

1. Stay in wallet settings and open **Statement links**.
2. Choose **Share statement**.
3. Pick a **Period** that includes some of the transactions you created.
4. Optionally set a **Display title** (for example `March holding`).
5. Choose **Preview** and check opening balance, transactions, and closing balance.
6. Choose **Create link**.
7. **Copy** the URL immediately — it is shown once — then choose **Done**.

Open the link in a private window (no sign-in). You should see the same read-only statement.

When you are finished sharing, return to **Statement links** and revoke the link so it can no longer be opened.

---

## 9. Review the activity log

Activity is available to the wallet **owner** only.

1. In wallet settings, open the **Activity** section.
2. Scan the chronological list. You should recognize recent actions such as created transactions, a transfer, an invited member, and a statement share.
3. Expand **Details** on a row if you want before/after values.
4. If a change falls inside an active shared period, you may see an **Affects shared statement** badge — the public snapshot stays frozen; the badge warns that live wallet data has moved on.

Activity entries are never edited or deleted. Use them when you need to answer who changed the wallet and when.

---

## What you can do now

You have completed a full Ledger Box loop:

1. Sign in
2. Create wallets
3. Record income and expense
4. Edit and delete transactions (balances stay consistent)
5. Attach supporting files
6. Transfer between wallets
7. Invite a viewer or manager
8. Share and revoke a statement link
9. Read the owner activity log

Keep using description text instead of categories, treat transfers as a pair, and open **Activity** whenever you need to account for a balance change.
