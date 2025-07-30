import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { 
  useWorkflowTaskList,
  useWorkflowTask,
  WorkflowTrigger,
  WorkflowProgressBar,
  useTaskStore
} from '../src/workflow-task';
import { AgentStreamDisplay } from '../src/workflow-task/components/agent-stream-display';

// Task Trigger & Progress Component  
function TaskTriggerSection({ onTaskClick, selectedTaskId }: { onTaskClick: (taskId: string) => void; selectedTaskId: string | null }) {
  const { tasks, clearCompleted } = useWorkflowTaskList();
  const { createTask } = useTaskStore();
  const [batchSize, setBatchSize] = useState(3);
  const [isCreatingBatch, setIsCreatingBatch] = useState(false);

  // Sample task configurations for batch creation
  const taskConfigs = [
    { name: 'Document Analysis', input: { file: 'document1.pdf', type: 'analysis' } },
    { name: 'Data Processing', input: { file: 'data.csv', type: 'processing' } },
    { name: 'Image Recognition', input: { file: 'image.jpg', type: 'recognition' } },
    { name: 'Text Extraction', input: { file: 'text.docx', type: 'extraction' } },
    { name: 'Report Generation', input: { file: 'report.xlsx', type: 'generation' } },
  ];

  const createBatchTasks = async () => {
    setIsCreatingBatch(true);
    try {
      // Create multiple tasks simultaneously
      const promises = Array.from({ length: batchSize }, async (_, index) => {
        const config = taskConfigs[index % taskConfigs.length];
        const input = JSON.stringify({
          ...config.input,
          taskName: `${config.name} #${index + 1}`,
          batchId: Date.now(),
        });
        
        // Stagger the creation slightly to see the effect
        await new Promise(resolve => setTimeout(resolve, index * 100));
        return createTask('process_file', input);
      });
      
      await Promise.all(promises);
      console.log(`Successfully created ${batchSize} tasks`);
    } catch (error) {
      console.error('Failed to create batch tasks:', error);
    } finally {
      setIsCreatingBatch(false);
    }
  };

  return (
    <div className="p-6 border-r border-gray-200 w-1/2 space-y-6">
      {/* Batch Task Creation */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Batch Task Creation</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Batch Size:</label>
            <select 
              value={batchSize} 
              onChange={(e) => setBatchSize(Number(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
              disabled={isCreatingBatch}
            >
              {[1, 2, 3, 4, 5].map(n => (
                <option key={n} value={n}>{n} tasks</option>
              ))}
            </select>
            <button
              onClick={createBatchTasks}
              disabled={isCreatingBatch}
              className={`px-4 py-2 text-sm font-medium rounded ${
                isCreatingBatch 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isCreatingBatch ? 'Creating...' : `Create ${batchSize} Tasks`}
            </button>
            {tasks.length > 0 && (
              <button
                onClick={clearCompleted}
                className="px-4 py-2 text-sm font-medium rounded bg-gray-600 text-white hover:bg-gray-700"
              >
                Clear Completed
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Single Task Creation */}
      <div>
        <h3 className="text-lg font-medium mb-3">Or Create Single Task</h3>
        <WorkflowTrigger 
          deployment="process_file"
          onSuccess={(result: unknown) => {
            console.log('Suite: Single task completed:', result);
          }}
        />
      </div>

      {/* Progress Section - only show when there are tasks */}
      {tasks.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-3">Overall Progress ({tasks.length} tasks)</h3>
          <WorkflowProgressBar />
          
          {/* Task list summary */}
          <div className="mt-4 space-y-2">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-medium text-gray-700">Task Status:</h4>
              <div className="text-xs text-gray-500">
                Running: {tasks.filter(t => t.status === 'running').length} | 
                Complete: {tasks.filter(t => t.status === 'complete').length} | 
                Error: {tasks.filter(t => t.status === 'error').length}
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {tasks.map((task, index) => {
                const isSelected = selectedTaskId === task.task_id;
                return (
                  <div 
                    key={task.task_id} 
                    className={`flex justify-between items-center text-sm p-2 rounded cursor-pointer transition-colors ${
                      isSelected 
                        ? 'bg-blue-100 border border-blue-300 hover:bg-blue-200' 
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                    onClick={() => onTaskClick(task.task_id)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">#{index + 1}</span>
                      <span className="font-mono text-xs truncate">{task.task_id}</span>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${
                      task.status === 'complete' ? 'bg-green-100 text-green-800' :
                      task.status === 'error' ? 'bg-red-100 text-red-800' :
                      task.status === 'running' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {task.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Task Detail Component with AgentStreamDisplay
function TaskDetailSection({ taskId }: { taskId: string | null }) {
  // Always call hooks at the top level
  const taskDetail = useWorkflowTask(taskId || "");
  
  if (!taskId) {
    return (
      <div className="p-6 w-1/2 flex items-center justify-center text-gray-500">
        Create a task to view processing details        
      </div>
    );
  }

  // Debug logging
  const debugInfo = {
    taskId,
    task: taskDetail.task,
    eventsCount: taskDetail.events.length,
    isStreaming: taskDetail.isStreaming
  };
  console.log('TaskDetailSection Debug:', debugInfo);

  if (!taskDetail.task) {
    return (
      <div className="p-6 w-1/2 flex items-center justify-center text-gray-500">
        Loading task details...
      </div>
    );
  }

  return (
    <div className="p-6 w-1/2">
      <div className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-semibold">Task Details</h2>
          <div className="flex gap-2">
            <button
              onClick={taskDetail.clearEvents}
              className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Clear Events
            </button>
            <button
              onClick={taskDetail.stopStreaming}
              className="px-3 py-1 text-sm bg-red-200 text-red-700 rounded hover:bg-red-300"
            >
              Stop Stream
            </button>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div>
            <span className="font-medium">Task ID:</span> {taskDetail.task.task_id}
          </div>
          <div>
            <span className="font-medium">Deployment:</span> {taskDetail.task.deployment}
          </div>
          <div>
            <span className="font-medium">Status:</span> 
            <span className={`ml-2 px-2 py-1 rounded text-sm ${
              taskDetail.task.status === 'complete' ? 'bg-green-100 text-green-800' :
              taskDetail.task.status === 'error' ? 'bg-red-100 text-red-800' :
              taskDetail.task.status === 'running' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {taskDetail.task.status}
            </span>
          </div>
          <div>
            <span className="font-medium">Streaming:</span> 
            <span className={`ml-2 px-2 py-1 rounded text-sm ${
              taskDetail.isStreaming ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {taskDetail.isStreaming ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div>
            <span className="font-medium">Events:</span> 
            <span className="ml-2 text-sm text-gray-600">
              {taskDetail.events.length} events received
            </span>
          </div>
        </div>
      </div>

      {/* Agent Stream - use taskId instead of events */}
      <AgentStreamDisplay 
        taskId={taskDetail.task.task_id}
        title="Processing Steps"
        className="mb-4"
      />
    </div>
  );
}

// Internal Suite Component (uses hooks inside Provider)
function WorkflowTaskSuiteInternal() {
  const { tasks } = useWorkflowTaskList();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  
  // Get the selected task or the most recent task for details
  const selectedTask = selectedTaskId 
    ? tasks.find(t => t.task_id === selectedTaskId) 
    : tasks.length > 0 ? tasks[tasks.length - 1] : null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
        <h1 className="text-2xl font-bold mb-2">Workflow Task Suite</h1>
        <p className="text-gray-600">Complete workflow management with trigger, progress tracking, and processing details</p>
      </div>

      {/* Main Content */}
      <div className="flex h-[800px] border rounded-lg">
        <TaskTriggerSection onTaskClick={setSelectedTaskId} selectedTaskId={selectedTaskId} />
        <TaskDetailSection 
          taskId={selectedTask?.task_id || null}
        />
      </div>
    </div>
  );
}

// Main Suite Component (no provider needed anymore)
function WorkflowTaskSuite() {
  return <WorkflowTaskSuiteInternal />;
}

const meta: Meta<typeof WorkflowTaskSuite> = {
  title: 'Components/Workflow Task Suite',
  component: WorkflowTaskSuite,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A complete workflow task management suite including task creation, progress tracking, and processing detail viewing.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof WorkflowTaskSuite>;

export const Default: Story = {
  name: 'Complete Workflow Suite',
  parameters: {
    docs: {
      description: {
        story: `
This story demonstrates a complete workflow task management suite with batch processing capabilities:

**Components included:**
- **Batch Task Creation**: Create multiple workflow tasks simultaneously
- **Task Trigger**: File uploader with form validation to create individual tasks
- **Progress Tracking**: Real-time progress bar showing overall task completion
- **Processing Details**: Step-by-step processing visualization with task information
- **Task Management**: Summary of all tasks with status indicators and counters

**Features:**
- **Batch Processing**: Create 1-5 tasks simultaneously to test concurrent workflows
- **Individual Task Creation**: Upload files with part number validation
- **Real-time Progress**: Live progress bar and status updates
- **Task Management**: Clear completed tasks, view task counters
- **Processing Visualization**: Step-by-step processing with timestamps
- **Concurrent Task Handling**: Demonstrates the store's ability to handle multiple simultaneous tasks

**How to use:**
1. **Batch Creation**: Select batch size (1-5) and click "Create X Tasks" to test concurrent processing
2. **Individual Tasks**: Upload a file and enter a part number for single task creation
3. **Monitor Progress**: Watch the overall progress bar and individual task statuses
4. **View Details**: Click on tasks to see detailed processing steps in the right panel
5. **Manage Tasks**: Use "Clear Completed" to clean up finished tasks

**Technical Highlights:**
- Tests the duplicate subscription fix (no repeated events)
- Demonstrates concurrent task processing
- Shows real-time UI updates with multiple active streams
- Validates task store performance under load

The suite uses MSW (Mock Service Worker) to simulate realistic API responses and streaming events.
        `,
      },
    },
  },
}; 