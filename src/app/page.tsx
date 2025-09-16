import { SignInButton, SignUpButton, UserButton, SignedIn, SignedOut } from "@clerk/nextjs";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          Inventory Dashboard
        </h1>
        
        <div className="flex flex-col items-center gap-4">
          <SignedOut>
            <div className="flex gap-4">
              <SignInButton mode="modal">
                <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
                  Sign Up
                </button>
              </SignUpButton>
            </div>
          </SignedOut>
          
          <SignedIn>
            <div className="flex flex-col items-center gap-4">
              <p className="text-lg">Welcome to your dashboard!</p>
              <UserButton afterSignOutUrl="/" />
            </div>
          </SignedIn>
        </div>
      </div>
    </main>
  );
}