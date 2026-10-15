import { createElement } from '../apps/web/node_modules/react';
import { hydrateRoot } from '../apps/web/node_modules/react-dom/client';
import FeedbackCenter from '../apps/web/src/components/FeedbackCenter';
import SmartServices from '../apps/web/src/components/SmartServices';
import OperationsDemo from '../apps/web/src/components/OperationsDemo';
import '../apps/web/src/scripts/experience';

const publicRoot = document.getElementById('publicFeedback');
const adminRoot = document.getElementById('adminFeedback');
if (publicRoot) hydrateRoot(publicRoot, createElement(FeedbackCenter, { mode: 'public' }));
if (adminRoot) hydrateRoot(adminRoot, createElement(FeedbackCenter, { mode: 'admin' }));
const smartRoot = document.getElementById('smartServices');
const operationsRoot = document.getElementById('operationsDemo');
if (smartRoot) hydrateRoot(smartRoot, createElement(SmartServices));
if (operationsRoot) hydrateRoot(operationsRoot, createElement(OperationsDemo));
