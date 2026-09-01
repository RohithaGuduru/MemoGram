import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { MobileFrame } from './components/layout/MobileFrame';
import { ToastContainer } from './components/common/ToastContainer';
import { SOSModal } from './components/common/SOSModal';

// Onboarding Screens
import { WelcomeScreen } from './screens/onboarding/WelcomeScreen';
import { RoleSelectionScreen } from './screens/onboarding/RoleSelectionScreen';
import { CaretakerAuthScreen } from './screens/onboarding/CaretakerAuthScreen';
import { CaretakerSetupScreen } from './screens/onboarding/CaretakerSetupScreen';
import { PatientAuthScreen } from './screens/onboarding/PatientAuthScreen';
import { PatientSetupScreen } from './screens/onboarding/PatientSetupScreen';

// Caretaker Portal Screens
import { CaretakerDashboardScreen } from './screens/caretaker/CaretakerDashboardScreen';
import { CaretakerMedicationsScreen } from './screens/caretaker/CaretakerMedicationsScreen';
import { CaretakerPatientScreen } from './screens/caretaker/CaretakerPatientScreen';
import { CaretakerCognitiveScreen } from './screens/caretaker/CaretakerCognitiveScreen';
import { CaretakerReportsScreen } from './screens/caretaker/CaretakerReportsScreen';
import { CaretakerProfileScreen } from './screens/caretaker/CaretakerProfileScreen';
import { CaretakerSettingsScreen } from './screens/caretaker/CaretakerSettingsScreen';

// Patient Screens
import { PatientHomeScreen } from './screens/patient/PatientHomeScreen';
import { PatientMedsScreen } from './screens/patient/PatientMedsScreen';
import { PatientGamesScreen } from './screens/patient/PatientGamesScreen';
import { PatientAlertsScreen } from './screens/patient/PatientAlertsScreen';
import { PatientProfileScreen } from './screens/patient/PatientProfileScreen';
import { PatientSettingsScreen } from './screens/patient/PatientSettingsScreen';
import { PatientHelpScreen } from './screens/patient/PatientHelpScreen';

// Interactive Cognitive Games
import { GroceriesGame } from './screens/games/GroceriesGame';
import { RoutineSequenceGame } from './screens/games/RoutineSequenceGame';
import { CupShuffleGame } from './screens/games/CupShuffleGame';
import { CulturalMatchGame } from './screens/games/CulturalMatchGame';
import { FamilyStoriesGame } from './screens/games/FamilyStoriesGame';

const ScreenRouter: React.FC = () => {
  const { currentScreen } = useApp();

  const renderActiveScreen = () => {
    switch (currentScreen) {
      // Flow 1: Welcome
      case 'welcome':
        return <WelcomeScreen />;

      // Flow 2: Role Selection
      case 'role_selection':
        return <RoleSelectionScreen />;

      // Flow 3: Caretaker Auth
      case 'caretaker_auth':
        return <CaretakerAuthScreen />;

      // Flow 4: Caretaker Setup (4-step wizard)
      case 'caretaker_setup':
        return <CaretakerSetupScreen />;

      // Flow 5: Caretaker Dashboard
      case 'caretaker_dashboard':
        return <CaretakerDashboardScreen />;

      case 'caretaker_medications':
        return <CaretakerMedicationsScreen />;

      case 'caretaker_patient':
        return <CaretakerPatientScreen />;

      case 'caretaker_cognitive':
        return <CaretakerCognitiveScreen />;

      case 'caretaker_reports':
        return <CaretakerReportsScreen />;

      case 'caretaker_profile':
        return <CaretakerProfileScreen />;

      case 'caretaker_settings':
        return <CaretakerSettingsScreen />;

      // Flow 6: Patient Auth & Setup
      case 'patient_auth':
        return <PatientAuthScreen />;

      case 'patient_setup':
        return <PatientSetupScreen />;

      // Flow 7: Patient Home
      case 'patient_home':
        return <PatientHomeScreen />;

      case 'patient_meds':
        return <PatientMedsScreen />;

      case 'patient_games':
        return <PatientGamesScreen />;

      case 'patient_alerts':
        return <PatientAlertsScreen />;

      case 'patient_profile':
        return <PatientProfileScreen />;

      case 'patient_settings':
        return <PatientSettingsScreen />;

      case 'patient_help':
        return <PatientHelpScreen />;

      // 5 Core Cognitive Games
      case 'game_groceries':
        return <GroceriesGame />;

      case 'game_routine':
        return <RoutineSequenceGame />;

      case 'game_cup_shuffle':
        return <CupShuffleGame />;

      case 'game_cultural_match':
        return <CulturalMatchGame />;

      case 'game_family_stories':
        return <FamilyStoriesGame />;

      default:
        return <WelcomeScreen />;
    }
  };

  return (
    <MobileFrame>
      {renderActiveScreen()}
      <ToastContainer />
      <SOSModal />
    </MobileFrame>
  );
};

export function App() {
  return (
    <AppProvider>
      <ScreenRouter />
    </AppProvider>
  );
}

export default App;
