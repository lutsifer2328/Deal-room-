I need you to redesign my entire website to match the visual style of the 
Deal Room mockup you just created, while preserving ALL existing functionality 
and logic.

Requirements:
1. PRESERVE ALL FUNCTIONALITY - Don't change any:
   - API calls or endpoints
   - Database queries
   - Form submissions
   - State management logic
   - Event handlers (just keep the existing logic)
   - Routing
   - Authentication/authorization
   - Business logic

2. ONLY UPDATE:
   - CSS/styling (colors, fonts, spacing, shadows, animations)
   - HTML structure (only for better semantic markup, keeping same data)
   - Class names (you can add new classes but keep existing ones for functionality)
   - Visual components (buttons, cards, inputs - same functionality, new look)

3. BRANDING TO MATCH:
   - Agenzia.bg visual identity
   - Navy (#1a2332) and teal (#2dd4bf) color scheme
   - Playfair Display for headings, DM Sans for body
   - Same sophisticated, premium aesthetic from the Deal Room mockup

4. PROVIDE:
   - Step-by-step analysis of current code structure
   - New CSS/styling files that can be swapped in
   - Modified component files (if using React/Vue) with only visual changes
   - Migration guide showing what to replace

Please start by asking me to upload the current codebase files or share the 
repository structure, then analyze what framework/stack is being used.
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Deal Room - Agenzia Platform</title>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        :root {
            --primary-navy: #1a2332;
            --secondary-navy: #243447;
            --accent-gold: #d4af37;
            --accent-teal: #2dd4bf;
            --text-primary: #0f172a;
            --text-secondary: #64748b;
            --text-light: #94a3b8;
            --bg-white: #ffffff;
            --bg-gray: #f8fafc;
            --border-light: #e2e8f0;
            --success: #10b981;
            --warning: #f59e0b;
            --danger: #ef4444;
        }

        body {
            font-family: 'DM Sans', sans-serif;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            color: var(--text-primary);
            overflow-x: hidden;
        }

        .app-container {
            display: flex;
            min-height: 100vh;
        }

        /* Sidebar */
        .sidebar {
            width: 280px;
            background: linear-gradient(180deg, var(--primary-navy) 0%, var(--secondary-navy) 100%);
            padding: 2rem 0;
            position: fixed;
            height: 100vh;
            box-shadow: 4px 0 24px rgba(0, 0, 0, 0.12);
            z-index: 100;
        }

        .logo-section {
            padding: 0 2rem 2rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            margin-bottom: 2rem;
        }

        .logo-title {
            font-family: 'Playfair Display', serif;
            font-size: 1.75rem;
            font-weight: 700;
            color: var(--bg-white);
            letter-spacing: 0.5px;
            margin-bottom: 0.25rem;
        }

        .logo-subtitle {
            font-size: 0.75rem;
            color: var(--accent-teal);
            text-transform: uppercase;
            letter-spacing: 2px;
            font-weight: 600;
        }

        .agenzia-brand {
            margin-top: 0.75rem;
            padding-top: 0.75rem;
            border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .brand-logo {
            font-family: 'Playfair Display', serif;
            font-size: 1.5rem;
            color: var(--bg-white);
            font-style: italic;
            letter-spacing: 1px;
        }

        .nav-menu {
            list-style: none;
        }

        .nav-item {
            margin: 0.25rem 0;
        }

        .nav-link {
            display: flex;
            align-items: center;
            padding: 1rem 2rem;
            color: rgba(255, 255, 255, 0.7);
            text-decoration: none;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            font-weight: 500;
            border-left: 3px solid transparent;
        }

        .nav-link:hover {
            background: rgba(255, 255, 255, 0.05);
            color: var(--bg-white);
            border-left-color: var(--accent-teal);
        }

        .nav-link.active {
            background: rgba(45, 212, 191, 0.1);
            color: var(--accent-teal);
            border-left-color: var(--accent-teal);
        }

        .nav-icon {
            width: 20px;
            height: 20px;
            margin-right: 1rem;
            opacity: 0.8;
        }

        .language-selector {
            position: absolute;
            bottom: 2rem;
            left: 2rem;
            right: 2rem;
        }

        .user-profile {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 1rem;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.3s;
        }

        .user-profile:hover {
            background: rgba(255, 255, 255, 0.08);
        }

        .user-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--accent-teal), var(--accent-gold));
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            color: var(--primary-navy);
        }

        .user-info {
            flex: 1;
        }

        .user-name {
            color: var(--bg-white);
            font-weight: 600;
            font-size: 0.875rem;
        }

        .user-role {
            color: var(--text-light);
            font-size: 0.75rem;
        }

        /* Main Content */
        .main-content {
            margin-left: 280px;
            flex: 1;
            padding: 2rem 3rem;
            animation: fadeIn 0.5s ease-out;
        }

        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        /* Header */
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 3rem;
        }

        .search-bar {
            flex: 1;
            max-width: 600px;
            position: relative;
        }

        .search-input {
            width: 100%;
            padding: 0.875rem 1.25rem 0.875rem 3rem;
            border: 2px solid var(--border-light);
            border-radius: 16px;
            font-size: 0.9375rem;
            background: var(--bg-white);
            transition: all 0.3s;
            font-family: 'DM Sans', sans-serif;
        }

        .search-input:focus {
            outline: none;
            border-color: var(--accent-teal);
            box-shadow: 0 0 0 4px rgba(45, 212, 191, 0.1);
        }

        .search-icon {
            position: absolute;
            left: 1.25rem;
            top: 50%;
            transform: translateY(-50%);
            color: var(--text-light);
        }

        .header-actions {
            display: flex;
            gap: 1rem;
            align-items: center;
        }

        .notification-btn {
            position: relative;
            width: 44px;
            height: 44px;
            border-radius: 12px;
            border: 2px solid var(--border-light);
            background: var(--bg-white);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s;
        }

        .notification-btn:hover {
            border-color: var(--accent-teal);
            background: rgba(45, 212, 191, 0.05);
        }

        .notification-badge {
            position: absolute;
            top: -4px;
            right: -4px;
            width: 18px;
            height: 18px;
            background: var(--danger);
            border-radius: 50%;
            font-size: 0.625rem;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
        }

        .user-menu {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.5rem 1rem;
            border-radius: 12px;
            background: var(--bg-white);
            border: 2px solid var(--border-light);
            cursor: pointer;
            transition: all 0.3s;
        }

        .user-menu:hover {
            border-color: var(--accent-teal);
        }

        /* Deal Card */
        .deal-card {
            background: var(--bg-white);
            border-radius: 24px;
            padding: 3rem;
            box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
            animation: slideUp 0.6s ease-out 0.1s both;
        }

        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .deal-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 2rem;
            padding-bottom: 2rem;
            border-bottom: 2px solid var(--bg-gray);
        }

        .deal-title-section {
            flex: 1;
        }

        .deal-type {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            background: linear-gradient(135deg, rgba(45, 212, 191, 0.1), rgba(45, 212, 191, 0.05));
            border: 1px solid var(--accent-teal);
            border-radius: 8px;
            color: var(--accent-teal);
            font-size: 0.8125rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 1rem;
        }

        .status-badge {
            padding: 0.5rem 1.25rem;
            background: var(--success);
            color: white;
            border-radius: 20px;
            font-size: 0.8125rem;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
        }

        .status-dot {
            width: 6px;
            height: 6px;
            background: white;
            border-radius: 50%;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }

        .deal-title {
            font-family: 'Playfair Display', serif;
            font-size: 2.5rem;
            font-weight: 700;
            color: var(--text-primary);
            margin-bottom: 0.75rem;
            line-height: 1.2;
        }

        .deal-address {
            color: var(--text-secondary);
            font-size: 1.125rem;
            margin-bottom: 0.5rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .deal-meta {
            color: var(--text-light);
            font-size: 0.9375rem;
        }

        .deal-actions {
            display: flex;
            gap: 1rem;
        }

        .btn {
            padding: 0.875rem 1.75rem;
            border-radius: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border: none;
            font-family: 'DM Sans', sans-serif;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .btn-primary {
            background: linear-gradient(135deg, var(--accent-teal), #14b8a6);
            color: white;
            box-shadow: 0 4px 12px rgba(45, 212, 191, 0.3);
        }

        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(45, 212, 191, 0.4);
        }

        .btn-secondary {
            background: var(--bg-white);
            color: var(--text-primary);
            border: 2px solid var(--border-light);
        }

        .btn-secondary:hover {
            border-color: var(--accent-teal);
            background: rgba(45, 212, 191, 0.05);
        }

        /* Progress Section */
        .progress-section {
            margin: 3rem 0;
            padding: 2.5rem;
            background: linear-gradient(135deg, rgba(248, 250, 252, 0.8), rgba(241, 245, 249, 0.8));
            border-radius: 20px;
            border: 1px solid var(--border-light);
        }

        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2.5rem;
        }

        .section-title {
            font-family: 'Playfair Display', serif;
            font-size: 1.5rem;
            font-weight: 600;
            color: var(--text-primary);
        }

        .edit-stages {
            color: var(--accent-teal);
            font-size: 0.875rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-weight: 500;
            transition: all 0.3s;
        }

        .edit-stages:hover {
            gap: 0.75rem;
        }

        /* Progress Steps */
        .progress-tracker {
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: relative;
            padding: 2rem 0;
        }

        .progress-line {
            position: absolute;
            top: 50%;
            left: 0;
            right: 0;
            height: 3px;
            background: var(--border-light);
            transform: translateY(-50%);
            z-index: 0;
        }

        .progress-fill {
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            background: linear-gradient(90deg, var(--accent-teal), #14b8a6);
            width: 20%;
            transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 0 20px rgba(45, 212, 191, 0.4);
        }

        .step {
            display: flex;
            flex-direction: column;
            align-items: center;
            position: relative;
            z-index: 1;
            flex: 1;
        }

        .step-circle {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: var(--bg-white);
            border: 3px solid var(--border-light);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 1.125rem;
            margin-bottom: 1rem;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
        }

        .step.completed .step-circle {
            background: linear-gradient(135deg, var(--accent-teal), #14b8a6);
            border-color: var(--accent-teal);
            color: white;
            box-shadow: 0 4px 16px rgba(45, 212, 191, 0.3);
            animation: checkmark 0.5s ease-out;
        }

        @keyframes checkmark {
            0% { transform: scale(0.8); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }

        .step.active .step-circle {
            border-color: var(--accent-teal);
            color: var(--accent-teal);
            background: linear-gradient(135deg, rgba(45, 212, 191, 0.1), rgba(45, 212, 191, 0.05));
            box-shadow: 0 0 0 8px rgba(45, 212, 191, 0.1);
            animation: pulse-ring 2s infinite;
        }

        @keyframes pulse-ring {
            0%, 100% { box-shadow: 0 0 0 8px rgba(45, 212, 191, 0.1); }
            50% { box-shadow: 0 0 0 12px rgba(45, 212, 191, 0.05); }
        }

        .step-label {
            font-weight: 600;
            color: var(--text-secondary);
            text-align: center;
            font-size: 0.9375rem;
            transition: color 0.3s;
        }

        .step.completed .step-label,
        .step.active .step-label {
            color: var(--text-primary);
        }

        .step-note {
            margin-top: 1rem;
            padding: 0.75rem 1.25rem;
            background: rgba(251, 191, 36, 0.1);
            border-left: 3px solid var(--warning);
            border-radius: 8px;
            font-size: 0.875rem;
            color: var(--text-secondary);
            font-style: italic;
        }

        /* Documents Section */
        .documents-section {
            margin-top: 3rem;
        }

        .documents-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
        }

        .add-document-btn {
            color: var(--accent-teal);
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            transition: all 0.3s;
        }

        .add-document-btn:hover {
            gap: 0.75rem;
        }

        .documents-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 1.5rem;
        }

        .document-card {
            background: var(--bg-white);
            border: 2px solid var(--border-light);
            border-radius: 16px;
            padding: 1.5rem;
            transition: all 0.3s;
            cursor: pointer;
        }

        .document-card:hover {
            border-color: var(--accent-teal);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
            transform: translateY(-4px);
        }

        .document-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 1rem;
        }

        .document-role {
            padding: 0.375rem 0.875rem;
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05));
            color: #3b82f6;
            border-radius: 6px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .document-status {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .status-icon {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.75rem;
        }

        .status-confirmed {
            background: var(--success);
            color: white;
        }

        .status-required {
            background: var(--danger);
            color: white;
            animation: attention 1.5s infinite;
        }

        @keyframes attention {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
        }

        .document-person {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 1rem;
        }

        .person-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: linear-gradient(135deg, #3b82f6, #2563eb);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 600;
        }

        .person-info {
            flex: 1;
        }

        .person-name {
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: 0.125rem;
        }

        .person-email {
            color: var(--text-light);
            font-size: 0.8125rem;
        }

        .document-title {
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: 0.5rem;
            font-size: 1rem;
        }

        .document-subtitle {
            color: var(--text-light);
            font-size: 0.875rem;
            line-height: 1.5;
        }

        /* Info Sidebar */
        .info-sidebar {
            background: linear-gradient(135deg, rgba(241, 245, 249, 0.8), rgba(248, 250, 252, 0.8));
            border-radius: 20px;
            padding: 2rem;
            margin-top: 3rem;
            border: 1px solid var(--border-light);
        }

        .sidebar-title {
            font-family: 'Playfair Display', serif;
            font-size: 1.25rem;
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: 1.5rem;
        }

        .info-item {
            margin-bottom: 1.5rem;
            padding-bottom: 1.5rem;
            border-bottom: 1px solid var(--border-light);
        }

        .info-item:last-child {
            border-bottom: none;
            margin-bottom: 0;
            padding-bottom: 0;
        }

        .info-label {
            color: var(--text-light);
            font-size: 0.875rem;
            margin-bottom: 0.5rem;
            font-weight: 500;
        }

        .info-value {
            color: var(--text-primary);
            font-weight: 600;
        }

        .quick-link {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: var(--accent-teal);
            text-decoration: none;
            font-weight: 600;
            transition: all 0.3s;
        }

        .quick-link:hover {
            gap: 0.75rem;
        }

        /* Responsive */
        @media (max-width: 1024px) {
            .sidebar {
                transform: translateX(-100%);
            }

            .main-content {
                margin-left: 0;
            }
        }
    </style>
</head>
<body>
    <div class="app-container">
        <!-- Sidebar -->
        <aside class="sidebar">
            <div class="logo-section">
                <div class="logo-title">DEAL ROOM</div>
                <div class="logo-subtitle">Powered by</div>
                <div class="agenzia-brand">
                    <div class="brand-logo">Agenzia</div>
                </div>
            </div>

            <nav>
                <ul class="nav-menu">
                    <li class="nav-item">
                        <a href="#" class="nav-link active">
                            <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            Сделки
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="#" class="nav-link">
                            <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                            </svg>
                            Архив
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="#" class="nav-link">
                            <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            Участници
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="#" class="nav-link">
                            <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Финанси
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="#" class="nav-link">
                            <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Настройки
                        </a>
                    </li>
                </ul>
            </nav>

            <div class="language-selector">
                <div class="user-profile">
                    <div class="user-avatar">A</div>
                    <div class="user-info">
                        <div class="user-name">Admin User</div>
                        <div class="user-role">Admin</div>
                    </div>
                </div>
            </div>
        </aside>

        <!-- Main Content -->
        <main class="main-content">
            <!-- Header -->
            <header class="header">
                <div class="search-bar">
                    <svg class="search-icon" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input type="text" class="search-input" placeholder="Search deals, clients, phone, email...">
                </div>
                <div class="header-actions">
                    <button class="notification-btn">
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <span class="notification-badge">3</span>
                    </button>
                    <div class="user-menu">
                        <div class="user-avatar">A</div>
                        <span style="font-weight: 600;">Admin User</span>
                    </div>
                </div>
            </header>

            <!-- Deal Card -->
            <div class="deal-card">
                <div class="deal-header">
                    <div class="deal-title-section">
                        <div class="deal-type">
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            СДЕЛКА - Luxury Apartment in Lozenets
                        </div>
                        <span class="status-badge">
                            <span class="status-dot"></span>
                            Active
                        </span>
                        <h1 class="deal-title">Luxury Apartment in Lozenets</h1>
                        <p class="deal-address">
                            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            42 Lozenets Boulevard, Sofia
                        </p>
                        <p class="deal-meta">Стартирана на 10.05.2025 г.</p>
                    </div>
                    <div class="deal-actions">
                        <button class="btn btn-secondary">
                            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            Управление на участници
                        </button>
                        <button class="btn btn-primary">
                            Статус
                            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- Progress Section -->
                <div class="progress-section">
                    <div class="section-header">
                        <h2 class="section-title">Прогрес на сделката</h2>
                        <div class="edit-stages">
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Редакция на етапи
                        </div>
                    </div>

                    <div class="progress-tracker">
                        <div class="progress-line">
                            <div class="progress-fill"></div>
                        </div>
                        
                        <div class="step completed">
                            <div class="step-circle">✓</div>
                            <div class="step-label">Onboarding</div>
                        </div>
                        
                        <div class="step active">
                            <div class="step-circle">2</div>
                            <div class="step-label">Documents</div>
                        </div>
                        
                        <div class="step">
                            <div class="step-circle">3</div>
                            <div class="step-label">Preliminary Contract</div>
                        </div>
                        
                        <div class="step">
                            <div class="step-circle">4</div>
                            <div class="step-label">Final Review</div>
                        </div>
                        
                        <div class="step">
                            <div class="step-circle">5</div>
                            <div class="step-label">Closing</div>
                        </div>
                    </div>

                    <div class="step-note">
                        💡 Кликнете на етап, за да преместите сделката
                    </div>
                </div>

                <!-- Documents Section -->
                <div class="documents-section">
                    <div class="documents-header">
                        <h2 class="section-title">Необходими документи</h2>
                        <div class="add-document-btn">
                            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                            </svg>
                            Добави изискване
                        </div>
                    </div>

                    <div class="documents-grid">
                        <div class="document-card">
                            <div class="document-header">
                                <span class="document-role">ПРОДАВАЧ</span>
                                <div class="document-status">
                                    <div class="status-icon status-confirmed">✓</div>
                                    <span style="color: var(--success); font-weight: 600; font-size: 0.875rem;">Потвърден</span>
                                </div>
                            </div>
                            <div class="document-person">
                                <div class="person-avatar">MI</div>
                                <div class="person-info">
                                    <div class="person-name">Maria Ivanova</div>
                                    <div class="person-email">maria@example.bg</div>
                                </div>
                            </div>
                            <div class="document-title">Proof of Ownership (Notary Deed)</div>
                            <div class="document-subtitle">Доказателство за собственост (Нотариален акт)</div>
                        </div>

                        <div class="document-card">
                            <div class="document-header">
                                <span class="document-role">КУПУВАЧ</span>
                                <div class="document-status">
                                    <div class="status-icon status-required">!</div>
                                    <span style="color: var(--danger); font-weight: 600; font-size: 0.875rem;">Задължително</span>
                                </div>
                            </div>
                            <div class="document-person">
                                <div class="person-avatar" style="background: linear-gradient(135deg, #f59e0b, #d97706);">JP</div>
                                <div class="person-info">
                                    <div class="person-name">John Peterson</div>
                                    <div class="person-email">john@example.com</div>
                                </div>
                            </div>
                            <div class="document-title">Identity Document</div>
                            <div class="document-subtitle">Документ за самоличност</div>
                        </div>

                        <div class="document-card">
                            <div class="document-header">
                                <span class="document-role">АГЕНЦИЯ</span>
                                <div class="document-status">
                                    <div class="status-icon status-confirmed">✓</div>
                                    <span style="color: var(--success); font-weight: 600; font-size: 0.875rem;">Потвърден</span>
                                </div>
                            </div>
                            <div class="document-person">
                                <div class="person-avatar" style="background: linear-gradient(135deg, var(--accent-teal), #14b8a6);">AL</div>
                                <div class="person-info">
                                    <div class="person-name">Agenzia Legal</div>
                                    <div class="person-email">legal@agenzia.bg</div>
                                </div>
                            </div>
                            <div class="document-title">Purchase Agreement Template</div>
                            <div class="document-subtitle">Типов договор за покупко-продажба</div>
                        </div>
                    </div>
                </div>

                <!-- Info Sidebar -->
                <div class="info-sidebar">
                    <h3 class="sidebar-title">Информация за сделката</h3>
                    
                    <div class="info-item">
                        <div class="info-label">Наблюдавана от</div>
                        <div class="info-value">Agenzia Legal</div>
                    </div>

                    <div class="info-item">
                        <div class="info-label">Всички документи се</div>
                        <div class="info-value">проверяват независимо.</div>
                    </div>

                    <div class="info-item">
                        <a href="#" class="quick-link">
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Банков стандарт за кредит
                        </a>
                    </div>

                    <div class="info-item">
                        <a href="#" class="quick-link">
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Activity Log
                        </a>
                    </div>
                </div>
            </div>
        </main>
    </div>

    <script>
        // Animate progress fill on load
        window.addEventListener('load', () => {
            setTimeout(() => {
                document.querySelector('.progress-fill').style.width = '20%';
            }, 300);
        });

        // Add hover effects and interactions
        document.querySelectorAll('.document-card').forEach(card => {
            card.addEventListener('click', () => {
                console.log('Document card clicked');
            });
        });
    </script>
</body>
</html>