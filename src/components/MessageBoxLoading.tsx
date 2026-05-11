const MessageBoxLoading = () => {
  return (
    <div className="flex flex-col space-y-4 w-full lg:w-9/12 py-3">
      <div className="flex items-center gap-2">
        <div className="h-5 w-5 rounded-full bg-light-secondary dark:bg-dark-secondary animate-pulse" />
        <div className="h-4 w-24 rounded-md bg-light-secondary dark:bg-dark-secondary animate-pulse" />
      </div>
      <div className="space-y-2 animate-pulse">
        <div className="h-2.5 rounded-full w-full bg-light-secondary dark:bg-dark-secondary" />
        <div className="h-2.5 rounded-full w-11/12 bg-light-secondary dark:bg-dark-secondary" />
        <div className="h-2.5 rounded-full w-9/12 bg-light-secondary dark:bg-dark-secondary" />
        <div className="h-2.5 rounded-full w-10/12 bg-light-secondary dark:bg-dark-secondary" />
      </div>
    </div>
  );
};

export default MessageBoxLoading;
