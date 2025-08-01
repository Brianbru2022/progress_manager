import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

// Use lucide-react for professional icons
// To use these in an environment without npm, you'd typically need a build step,
// but for this self-contained example, we'll include a simple SVG inline alternative.
const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" x2="12" y1="5" y2="19"></line>
    <line x1="5" x2="19" y1="12" y2="12"></line>
  </svg>
);
const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18"></path>
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
  </svg>
);
const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9"></path>
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
  </svg>
);
const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18"></path>
    <path d="m6 6 12 12"></path>
  </svg>
);

// Helper function to format dates
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Helper function to calculate the percentage that should be complete
const calculatePercentShouldBeComplete = (task) => {
  if (!task.programmeStartDate || !task.programmeEndDate) {
    return 0;
  }
  const start = new Date(task.programmeStartDate);
  const end = new Date(task.programmeEndDate);
  const now = new Date();

  // If task hasn't started or is already finished, handle edge cases
  if (now < start) return 0;
  if (now > end) return 100;

  const totalDuration = end.getTime() - start.getTime();
  const elapsedDuration = now.getTime() - start.getTime();

  return Math.min(100, Math.floor((elapsedDuration / totalDuration) * 100));
};

// Helper function to estimate a new completion date based on current progress
const estimateNewCompletionDate = (task) => {
  if (!task.actualStartDate || !task.percentComplete || task.percentComplete === 0) {
    return 'N/A';
  }
  const start = new Date(task.actualStartDate);
  const now = new Date();
  const elapsedDuration = now.getTime() - start.getTime();
  const totalEstimatedDuration = elapsedDuration / (task.percentComplete / 100);
  const newCompletionDate = new Date(start.getTime() + totalEstimatedDuration);
  return formatDate(newCompletionDate.toISOString().split('T')[0]);
};

// Main App Component
const App = () => {
  const [sites, setSites] = useState([]);
  const [activeSiteId, setActiveSiteId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddSiteModalOpen, setIsAddSiteModalOpen] = useState(false);
  const [isAddOrEditTaskModalOpen, setIsAddOrEditTaskModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);

  // Load data from localStorage on initial render
  useEffect(() => {
    try {
      const storedData = localStorage.getItem('construction-tracker-data');
      if (storedData) {
        setSites(JSON.parse(storedData));
      }
    } catch (e) {
      console.error('Failed to load data from localStorage', e);
    }
  }, []);

  // Save data to localStorage whenever sites state changes
  useEffect(() => {
    try {
      localStorage.setItem('construction-tracker-data', JSON.stringify(sites));
    } catch (e) {
      console.error('Failed to save data to localStorage', e);
    }
  }, [sites]);

  // Handle adding a new site
  const handleAddSite = (siteName) => {
    if (!siteName) return;
    const newSite = {
      id: `site-${Date.now()}`,
      name: siteName,
      tasks: [],
    };
    setSites([...sites, newSite]);
    setIsAddSiteModalOpen(false);
  };

  // Handle deleting a site
  const handleDeleteSite = (siteId) => {
    const isConfirmed = window.confirm('Are you sure you want to delete this site and all its tasks?');
    if (isConfirmed) {
      setSites(sites.filter(site => site.id !== siteId));
      if (activeSiteId === siteId) {
        setActiveSiteId(null);
      }
    }
  };

  // Handle adding or editing a task
  const handleSaveTask = (siteId, taskData) => {
    setSites(sites.map(site => {
      if (site.id === siteId) {
        // Find existing task to update
        const taskExists = site.tasks.find(task => task.id === taskData.id);
        if (taskExists) {
          // Log the update if the task already exists
          const updatedTask = {
            ...taskData,
            updateLog: [
              ...taskData.updateLog,
              {
                timestamp: new Date().toISOString(),
                percentComplete: taskData.percentComplete,
                actualEndDate: taskData.actualEndDate,
              }
            ]
          };
          return {
            ...site,
            tasks: site.tasks.map(task =>
              task.id === taskData.id ? updatedTask : task
            ),
          };
        } else {
          // Add a new task
          const newTask = {
            ...taskData,
            id: `task-${Date.now()}`,
            updateLog: [{
              timestamp: new Date().toISOString(),
              percentComplete: taskData.percentComplete,
              actualEndDate: taskData.actualEndDate,
            }]
          };
          return { ...site, tasks: [...site.tasks, newTask] };
        }
      }
      return site;
    }));
    setIsAddOrEditTaskModalOpen(false);
    setCurrentTask(null);
  };

  // Handle deleting a task
  const handleDeleteTask = (siteId, taskId) => {
    const isConfirmed = window.confirm('Are you sure you want to delete this task?');
    if (isConfirmed) {
      setSites(sites.map(site => {
        if (site.id === siteId) {
          return {
            ...site,
            tasks: site.tasks.filter(task => task.id !== taskId)
          };
        }
        return site;
      }));
    }
  };

  // Get the currently selected site
  const activeSite = sites.find(site => site.id === activeSiteId);

  // Modal for adding/editing a task
  const TaskModal = ({ site, task, onClose, onSave }) => {
    const [taskData, setTaskData] = useState(task || {
      name: '',
      programmeStartDate: '',
      programmeEndDate: '',
      actualStartDate: '',
      actualEndDate: '',
      percentComplete: 0,
      managerSuggestedDate: '',
      updateLog: []
    });

    const handleChange = (e) => {
      const { name, value } = e.target;
      setTaskData({ ...taskData, [name]: value });
    };

    const handleSave = () => {
      onSave(site.id, taskData);
    };

    const percentShouldBeComplete = calculatePercentShouldBeComplete(taskData);
    const estimatedNewCompletion = estimateNewCompletionDate(taskData);

    return (
      <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-2xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-gray-800">{task ? 'Edit Task' : 'Add New Task'}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-900 transition-colors duration-200">
              <XIcon />
            </button>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-gray-600 font-semibold mb-1">Task Name</label>
                <input
                  type="text"
                  name="name"
                  value={taskData.name}
                  onChange={handleChange}
                  placeholder="e.g., Foundation Work"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-gray-600 font-semibold mb-1">Program Start Date</label>
                <input
                  type="date"
                  name="programmeStartDate"
                  value={taskData.programmeStartDate}
                  onChange={handleChange}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-gray-600 font-semibold mb-1">Program End Date</label>
                <input
                  type="date"
                  name="programmeEndDate"
                  value={taskData.programmeEndDate}
                  onChange={handleChange}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-gray-600 font-semibold mb-1">Actual Start Date</label>
                <input
                  type="date"
                  name="actualStartDate"
                  value={taskData.actualStartDate}
                  onChange={handleChange}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-gray-600 font-semibold mb-1">Actual End Date</label>
                <input
                  type="date"
                  name="actualEndDate"
                  value={taskData.actualEndDate}
                  onChange={handleChange}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-gray-600 font-semibold mb-1">Manager Suggested Date</label>
                <input
                  type="date"
                  name="managerSuggestedDate"
                  value={taskData.managerSuggestedDate}
                  onChange={handleChange}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex flex-col col-span-1 md:col-span-2">
                <label className="text-gray-600 font-semibold mb-1">Progress (% Complete)</label>
                <input
                  type="range"
                  name="percentComplete"
                  min="0"
                  max="100"
                  value={taskData.percentComplete}
                  onChange={handleChange}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="mt-2 text-xl font-bold text-gray-800">{taskData.percentComplete}%</span>
              </div>
            </div>

            <div className="bg-gray-100 p-4 rounded-lg mt-6">
              <h3 className="text-lg font-bold text-gray-800 mb-2">Progress Overview</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <p>
                  <span className="font-semibold text-gray-600">Programme:</span> {taskData.programmeStartDate} to {taskData.programmeEndDate}
                </p>
                <p>
                  <span className="font-semibold text-gray-600">Actual:</span> {taskData.actualStartDate} to {taskData.actualEndDate || 'In Progress'}
                </p>
                <p>
                  <span className="font-semibold text-gray-600">Current Progress:</span> {taskData.percentComplete}%
                </p>
                <p>
                  <span className="font-semibold text-gray-600">Should Be Complete:</span> {percentShouldBeComplete}%
                </p>
                <p>
                  <span className="font-semibold text-gray-600">New Estimated Completion:</span> {estimatedNewCompletion}
                </p>
                <p>
                  <span className="font-semibold text-gray-600">Manager's Suggested Completion:</span> {formatDate(taskData.managerSuggestedDate)}
                </p>
              </div>
            </div>

            {taskData.updateLog && taskData.updateLog.length > 0 && (
              <div className="bg-gray-100 p-4 rounded-lg max-h-48 overflow-y-auto">
                <h3 className="text-lg font-bold text-gray-800 mb-2">Update History</h3>
                <ul className="text-sm text-gray-700 space-y-2">
                  {taskData.updateLog.map((log, index) => (
                    <li key={index} className="border-b border-gray-200 pb-2 last:border-b-0">
                      <strong>{formatDate(log.timestamp.split('T')[0])}:</strong> Progress updated to {log.percentComplete}%. Actual end date: {formatDate(log.actualEndDate)}.
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-3 text-gray-600 font-semibold bg-gray-200 rounded-full hover:bg-gray-300 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-3 text-white font-semibold bg-blue-600 rounded-full hover:bg-blue-700 transition-colors duration-200"
            >
              Save Task
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Modal for adding a new site
  const AddSiteModal = ({ onClose, onAdd }) => {
    const [siteName, setSiteName] = useState('');
    return (
      <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Add New Site</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-900 transition-colors duration-200">
              <XIcon />
            </button>
          </div>
          <input
            type="text"
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            placeholder="Enter site name"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 font-semibold bg-gray-200 rounded-full hover:bg-gray-300 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={() => onAdd(siteName)}
              className="px-4 py-2 text-white font-semibold bg-blue-600 rounded-full hover:bg-blue-700 transition-colors duration-200"
            >
              Add Site
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="font-sans antialiased text-gray-800 bg-gray-100 min-h-screen">
      <div className="container mx-auto p-6 lg:p-10">
        <header className="flex flex-col sm:flex-row justify-between items-center mb-8 pb-4 border-b border-gray-300">
          <h1 className="text-4xl font-extrabold text-gray-900">Construction Tracker</h1>
          <nav className="mt-4 sm:mt-0 flex flex-wrap gap-3">
            <button
              onClick={() => setActiveSiteId(null)}
              className={`px-6 py-3 rounded-full font-semibold transition-colors duration-200 ${
                activeSiteId === null
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-200'
              }`}
            >
              Sites
            </button>
            <button
              onClick={() => setIsAddSiteModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-full font-semibold bg-green-500 text-white shadow-lg hover:bg-green-600 transition-colors duration-200"
            >
              <PlusIcon /> Add Site
            </button>
          </nav>
        </header>

        {activeSiteId === null ? (
          // Main Sites Dashboard
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">Your Projects</h2>
            {sites.length === 0 ? (
              <p className="text-lg text-gray-500 italic">No sites added yet. Click "Add Site" to get started!</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sites.map(site => (
                  <div key={site.id} className="bg-white rounded-xl shadow-md overflow-hidden transform transition-transform duration-300 hover:scale-105 hover:shadow-xl">
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{site.name}</h3>
                      <p className="text-sm text-gray-500 mb-4">
                        {site.tasks.length} {site.tasks.length === 1 ? 'task' : 'tasks'}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setActiveSiteId(site.id)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-full font-semibold hover:bg-blue-600 transition-colors duration-200"
                        >
                          <EyeIcon /> View Site
                        </button>
                        <button
                          onClick={() => handleDeleteSite(site.id)}
                          className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors duration-200"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Site Details View
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">{activeSite?.name}</h2>
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-semibold text-gray-700">Tasks</h3>
              <button
                onClick={() => {
                  setCurrentTask(null);
                  setIsAddOrEditTaskModalOpen(true);
                }}
                className="flex items-center gap-2 px-6 py-3 rounded-full font-semibold bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <PlusIcon /> Add Task
              </button>
            </div>
            {activeSite && activeSite.tasks.length === 0 ? (
              <p className="text-lg text-gray-500 italic">No tasks for this site. Add one to get started!</p>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {activeSite && activeSite.tasks.map(task => {
                  const percentShouldBeComplete = calculatePercentShouldBeComplete(task);
                  const statusColor = task.percentComplete >= percentShouldBeComplete ? 'bg-green-500' : 'bg-red-500';
                  const estimatedNewCompletion = estimateNewCompletionDate(task);
                  const isBehindSchedule = task.percentComplete < percentShouldBeComplete;

                  return (
                    <div key={task.id} className="bg-white rounded-xl shadow-md p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex-1">
                        <h4 className="text-xl font-bold text-gray-900">{task.name}</h4>
                        <div className="mt-2 text-sm text-gray-600 space-y-1">
                          <p>
                            <span className="font-semibold">Programme:</span> {formatDate(task.programmeStartDate)} - {formatDate(task.programmeEndDate)}
                          </p>
                          <p>
                            <span className="font-semibold">Actual:</span> {formatDate(task.actualStartDate)} - {formatDate(task.actualEndDate)}
                          </p>
                          <p>
                            <span className="font-semibold">Estimated Completion:</span> {estimatedNewCompletion}
                          </p>
                          {isBehindSchedule && (
                            <p className="text-red-500 font-semibold flex items-center gap-1">
                              ⚠️ Behind Schedule
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0 flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto mt-4 sm:mt-0">
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-lg text-white" style={{
                            background: `conic-gradient(#3B82F6 ${task.percentComplete}%, #E5E7EB 0%)`
                          }}>
                            {task.percentComplete}%
                          </div>
                          <span className="text-sm mt-1 text-gray-600">Actual</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-lg text-white ${statusColor}`}>
                            {percentShouldBeComplete}%
                          </div>
                          <span className="text-sm mt-1 text-gray-600">Planned</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setCurrentTask(task);
                              setIsAddOrEditTaskModalOpen(true);
                            }}
                            className="p-3 bg-gray-200 text-gray-600 rounded-full hover:bg-gray-300 transition-colors duration-200"
                            title="Edit Task"
                          >
                            <EditIcon />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(activeSite.id, task.id)}
                            className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors duration-200"
                            title="Delete Task"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {isAddSiteModalOpen && (
        <AddSiteModal onClose={() => setIsAddSiteModalOpen(false)} onAdd={handleAddSite} />
      )}

      {isAddOrEditTaskModalOpen && (
        <TaskModal
          site={activeSite}
          task={currentTask}
          onClose={() => setIsAddOrEditTaskModalOpen(false)}
          onSave={handleSaveTask}
        />
      )}
    </div>
  );
};

// Mount the app to the DOM
const rootElement = document.getElementById('root');
const root = createRoot(rootElement);
root.render(<App />);

