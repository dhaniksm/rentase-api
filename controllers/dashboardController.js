const dashboardService = require('../services/dashboardService');

const sendError = (res, statusCode, message) => {
  return res.status(statusCode).json({
    success: false,
    message
  });
};

const sendSuccess = (res, statusCode, message, data = null) => {
  const response = {
    success: true
  };

  if (message) {
    response.message = message;
  }

  if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

const getSummary = async (req, res) => {
  try {
    const summaryData = await dashboardService.getDashboardSummary();
    return sendSuccess(res, 200, null, summaryData);
  } catch (error) {
    return sendError(res, 500, error.message || 'Failed to retrieve dashboard summary');
  }
};

const getRecentTransactions = async (req, res) => {
  try {
    const recentTransactions = await dashboardService.getRecentTransactions();

    return sendSuccess(res, 200, null, recentTransactions);
  } catch (error) {
    return sendError(res, 500, error.message || 'Failed to retrieve recent transactions');
  }
};

module.exports = {
  getSummary,
  getRecentTransactions
};
