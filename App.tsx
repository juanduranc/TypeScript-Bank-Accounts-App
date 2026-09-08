
// Hi, its Juan. Below I am sharing the TypeScript code about the Bank Account TypeScript App
//  Code content:
//  1: class BankAccount: 
//      Contains a constructor populating: accountId, accountHolder, accountinitialDeposit.
//      Includes setter, getters and methods
//  2: Map: A map to store all the bank account records created 
//  3: Function to recive inputs from user = 
//  4: Function to populate the history of user activity
//  5: Function to select instance of the bank account to then interact
//  6: Function mainLoop: Holds the "cases" for every bank account opeartion available
//  7: Function App(): The UI interface including HTML, CSS, useEffect, useState, useRef  


import { useState, useEffect, useRef } from "react";

class BankAccount {
  
  private static nextId = 1; // This is a static property shared across all instances to track auto-incrementing IDs
  readonly accountId: number; // Readonly public property assigned automatically on creation

  #balance: number = 0;
  private _accountHolder: string;

  constructor(accountHolder: string, initialDeposit: number = 0) {
    this.accountId = BankAccount.nextId++; // Assign current ID, then increment counter
    this._accountHolder = accountHolder;
    if (initialDeposit > 0) {
      this.#balance = initialDeposit;
    }
  }

  get accountHolder(): string {
    return this._accountHolder;
  }

  set accountHolder(newName: string) {
    if (!newName.trim()) {
      throw new Error("Account holder name cannot be empty.");
    }
    this._accountHolder = newName.trim();
  }

  get balance(): string {
    return `$${this.#balance.toFixed(2)}`;
  }

  deposit(amount: number): void {
    if (typeof amount !== "number" || Number.isNaN(amount)) {
      throw new Error("Deposit amount must be a valid number.");
    }
    if (amount <= 0) {
      throw new Error("Deposit amount must be positive.");
    }
    this.#balance += amount;
  }

  withdraw(amount: number): boolean {
    if (typeof amount !== "number" || Number.isNaN(amount)) {
      throw new Error("Withdrawal amount must be a valid number.");
    }
    if (amount <= 0 || amount > this.#balance) {
      return false;
    }
    this.#balance -= amount;
    return true;
  }
}

// MAP OF INSTANCE OF A CLASS --------------------------------------
// Using Map to store each BankAccount Instance
// to be pulled by id (number) call function getAccountFromPrompt
const accounts = new Map<number, BankAccount>();

// Global references for React UI bindings--------------------------
// Tells TypeScript these functions exists globally and what its signature looks like.
let askQuestion: (query: string) => Promise<string>;
let printLog: (message: string) => void;


// Function to pull correct account instance from Map using id ------------------
async function getAccountFromPrompt(): Promise<BankAccount | null> {
  const idInput = await askQuestion("Enter accountId: ");
  const accountId = parseInt(idInput, 10);
  const account = accounts.get(accountId);

  if (!account) {
    printLog(`\n❌ Error: No account found with ID ${accountId}\n`);
    return null;
  }
  return account;
}

async function mainLoop() {
  let running = true;

  while (running) {
    printLog("History -> -----------------------------------------");

    const option = await askQuestion("Select an option (1-6): ");

    switch (option.trim()) {
      case "1": {
        const name = await askQuestion("Enter account holder name: ");
        const depositInput = await askQuestion("Enter initial deposit (default 0): ");
        const initialDeposit = parseFloat(depositInput) || 0;

        try {
          const newAccount = new BankAccount(name, initialDeposit);
          accounts.set(newAccount.accountId, newAccount);
          printLog(
            `\n✅ Success! Account created for "${newAccount.accountHolder}" with ID: ${newAccount.accountId}\n`
          );
        } catch (err: any) {
          printLog(`\n❌ Error: ${err.message}\n`);
        }
        break;
      }

      case "2": {
        if (accounts.size === 0) {
          printLog("\n❌ No accounts available. You need to create an account first\n");
        } else {
          printLog("\n--- Accounts List ---");
          accounts.forEach((acc) => {
            printLog(`ID: ${acc.accountId} | Name: ${acc.accountHolder} | balance: ${acc.balance}`);
          });
          printLog("");
        }
        break;
      }

      case "3": {
        const account = await getAccountFromPrompt();
        if (account) {
          printLog(`\n💰 Account #${account.accountId} (${account.accountHolder}) Balance: ${account.balance}\n`);
        }
        break;
      }

      

      case "4": {
        const account = await getAccountFromPrompt();
        if (account) {
          const amountInput = await askQuestion("Enter deposit amount: ");
          const amount = parseFloat(amountInput);
          try {
            account.deposit(amount);
            printLog(`\n✅ Deposited $${amount}. New balance: ${account.balance}\n`);
          } catch (err: any) {
            printLog(`\n❌ Error: ${err.message}\n`);
          }
        }
        break;
      }

      case "5": {
        const account = await getAccountFromPrompt();
        if (account) {
          const amountInput = await askQuestion("Enter withdrawal amount: ");
          const amount = parseFloat(amountInput);
          const success = account.withdraw(amount);
          if (success) {
            printLog(`\n✅ Withdrew $${amount}. New balance: ${account.balance}\n`);
          } else {
            printLog(`\n❌ Withdrawal failed. Insufficient funds or invalid amount.\n`);
          }
        }
        break;
      }

      case "6": {
        const account = await getAccountFromPrompt();
        if (account) {
          const newName = await askQuestion("Enter new account holder name: ");
          try {
            account.accountHolder = newName;
            printLog(`\n✅ Account #${account.accountId} name updated to "${account.accountHolder}"\n`);
          } catch (err: any) {
            printLog(`\n❌ Error: ${err.message}\n`);
          }
        }
        break;
      }

      

      // case "7": {
      //   running = false;
      //   printLog("\nGoodbye");
      //   break;
      // }

      default:
        printLog("\n❌ Invalid option. Please enter 1-7.\n");
    }
  }
}

// React UI
export default function App() {
  const [logs, setLogs] = useState<string[]>([]);
  const [promptText, setPromptText] = useState(""); 
  const [inputValue, setInputValue] = useState(""); // It stores the resolve function of a pending Promise so that 
  // execution can pause during await askQuestion() and only resume when the user submits a form.
  const resolverRef = useRef<((value: string) => void) | null>(null); // 
  const startedRef = useRef(false); // Prevents StrictMode double execution
  const logContainerRef = useRef<HTMLPreElement>(null); // to auto-scroll

  printLog = (message: string) => {
    setLogs((prev) => [...prev, message]);
  };

  askQuestion = (query: string): Promise<string> => {
    setPromptText(query);
    return new Promise((resolve) => {
      resolverRef.current = resolve;
    });
  };

  useEffect(() => {
    if (!startedRef.current) {
      startedRef.current = true;
      mainLoop();
    }
  }, []);



  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (resolverRef.current) {
      printLog(`${promptText} ${inputValue}`);
      const resolve = resolverRef.current;
      resolverRef.current = null;
      setInputValue("");
      setPromptText("");
      resolve(inputValue);
    }
  };

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div style={{ padding: "2rem", fontFamily: "monospace", maxWidth: "600px" }}>
      <div style={{textAlign:'left'}}>
        
        <h2 style={{color:'green'}}>A TypeScript demo project by Juan S. Duran</h2><br/>
            <h2>Bank Account Manager</h2>
            Menu of options:
            <ol  style={{paddingTop:'0px', marginTop:'0px'}}>
              <li>Create new instance</li>
              <li>List all accounts</li>
              <li>Get balance</li>
              
              <li>Deposit</li>
              <li>Withdraw</li>
              <li>Update account holder name</li>
              {/* <li>Exit</li> */}
            </ol>
      </div>

     
      <div style={{textAlign:'left', marginBottom:'20px'}}>
        <form autoComplete="off" onSubmit={handleSubmit} style={{ marginTop: "1rem" }}>
          <label htmlFor="cli-input" style={{color:'green', fontSize:'x-large', fontWeight:'bold'}}>{promptText} </label><br/>
          <input
            id="cli-input"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            autoFocus 
          />
          <button type="submit">Submit</button>
        </form>
      </div>

      <div style={{backgroundColor:'lightgray', paddingTop:'1px', paddingLeft:'10px', paddingRight:'10px', paddingBottom:'10px', width:'100%', borderRadius:'5px'}}>
        <h3 style={{textAlign:'center'}}>History</h3>
        <pre ref={logContainerRef} style={{ background: "#1e1e1e", color: "lightgreen", padding: "1rem", borderRadius: "5px", height: "300px", overflowY: "auto", textAlign:'left' }}>
          {logs.join("\n")}
        </pre>
      </div>
      

    </div>
  );
}