export function BackgroundDecoration() {
  return (
    <>
      {/* Bottom left gradient */}
      <div className="fixed bottom-0 left-0 -z-10 opacity-30 dark:opacity-10 pointer-events-none hidden xl:block">
        <div className="relative w-[500px] h-[500px]">
          <div className="absolute bottom-[-100px] left-[-100px] w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-primary/20 to-transparent blur-3xl" />
        </div>
      </div>

      {/* Top right gradient */}
      <div className="fixed top-20 right-0 -z-10 opacity-30 dark:opacity-10 pointer-events-none hidden xl:block">
        <div className="relative w-[400px] h-[400px]">
          <div className="absolute top-[-50px] right-[-50px] w-[500px] h-[500px] rounded-full bg-gradient-to-bl from-primary/10 to-transparent blur-3xl" />
        </div>
      </div>
    </>
  );
}
