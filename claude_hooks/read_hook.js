async function main() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }

  const toolsArgs = JSON.parse(Buffer.concat(chunks).toString());
  const readPath = toolsArgs.tool_input?.file_path || toolsArgs.tool_input?.path || "";

  if (readPath.includes("env")) {
    console.error("Access to environment variables is not allowed by claude.");
    process.exit(2);
  }
}

main();
