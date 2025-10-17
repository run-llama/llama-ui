import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { HandlerList, HandlerDetails } from "../../src/workflows/components";
import { ApiProvider } from "../../src/lib";
import { useHandlerStore } from "../../src/workflows/hooks";
import type { Handler } from "../../src/workflows/store/handler";
import { Button } from "../../base/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../base/card";
import { Input } from "../../base/input";
import { Label } from "../../base/label";
import { createLocalWorkflowsClientForTests } from "@/src/lib/api-provider";

function WorkflowHandlerManagement() {
  const [selectedHandler, setSelectedHandler] = useState<Handler | null>(null);
  const [workflowName, setWorkflowName] = useState("calculator");
  const [inputA, setInputA] = useState("10");
  const [inputB, setInputB] = useState("5");
  const [operation, setOperation] = useState("sum");
  const { createHandler } = useHandlerStore();

  const handleCreateWorkflow = async () => {
    try {
      const handler = await createHandler(workflowName, {
        a: parseInt(inputA),
        b: parseInt(inputB),
        operation: operation,
      });
      console.log("Workflow created:", handler);
    } catch (error) {
      console.error("Failed to create workflow:", error);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Workflow Handler Management</h1>

      {!selectedHandler ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Workflow Card */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Create Workflow</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="workflow-name">Workflow Name</Label>
                <Input
                  id="workflow-name"
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  placeholder="Enter workflow name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="input-a">Input A</Label>
                <Input
                  id="input-a"
                  type="number"
                  value={inputA}
                  onChange={(e) => setInputA(e.target.value)}
                  placeholder="Enter number A"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="input-b">Input B</Label>
                <Input
                  id="input-b"
                  type="number"
                  value={inputB}
                  onChange={(e) => setInputB(e.target.value)}
                  placeholder="Enter number B"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="operation">Operation</Label>
                <select
                  id="operation"
                  value={operation}
                  onChange={(e) => setOperation(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="sum">Sum</option>
                  <option value="subtract">Subtract</option>
                  <option value="multiply">Multiply</option>
                  <option value="divide">Divide</option>
                </select>
              </div>

              <Button onClick={handleCreateWorkflow} className="w-full">
                Create Handler
              </Button>
            </CardContent>
          </Card>

          {/* Handler List Card */}
          <div className="lg:col-span-2">
            <HandlerList onSelectHandler={setSelectedHandler} />
          </div>
        </div>
      ) : (
        /* Handler Details View */
        <HandlerDetails
          handler={selectedHandler}
          onBack={() => setSelectedHandler(null)}
        />
      )}
    </div>
  );
}

function WorkflowStoryWrapper() {
  return (
    <ApiProvider clients={createLocalWorkflowsClientForTests()}>
      <WorkflowHandlerManagement />
    </ApiProvider>
  );
}

const meta: Meta<typeof WorkflowStoryWrapper> = {
  title: "Workflows/Handler Management",
  component: WorkflowStoryWrapper,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof WorkflowStoryWrapper>;

export const Default: Story = {};
