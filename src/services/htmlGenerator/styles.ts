import { COLORS } from "../../constants/colors";
import { LIGHT_COLORS } from "../../constants/lightColors";

export const generateStyles = (): string => {
  return `
        /* Dark theme (default) */
        :root {
            --bg-primary-start: ${COLORS.BACKGROUND.PRIMARY_START};
            --bg-primary-end: ${COLORS.BACKGROUND.PRIMARY_END};
            --text-white: ${COLORS.TEXT.WHITE};
            --text-primary: ${COLORS.TEXT.PRIMARY};
            --text-secondary: ${COLORS.TEXT.SECONDARY};
            --text-muted: ${COLORS.TEXT.MUTED};
            --text-light: ${COLORS.TEXT.LIGHT};
            --text-lighter: ${COLORS.TEXT.LIGHTER};
            --status-success: ${COLORS.STATUS.SUCCESS};
            --status-error: ${COLORS.STATUS.ERROR};
            --status-neutral: ${COLORS.STATUS.NEUTRAL};
            --status-info: ${COLORS.STATUS.INFO};
            --status-warning: ${COLORS.STATUS.WARNING};
            --status-current: ${COLORS.STATUS.CURRENT};
            --badge-default-bg: ${COLORS.BADGE.DEFAULT_BG};
            --badge-default-text: ${COLORS.BADGE.DEFAULT_TEXT};
            --badge-in-range-bg: ${COLORS.BADGE.IN_RANGE_BG};
            --badge-in-range-text: ${COLORS.BADGE.IN_RANGE_TEXT};
            --badge-out-range-bg: ${COLORS.BADGE.OUT_RANGE_BG};
            --badge-out-range-text: ${COLORS.BADGE.OUT_RANGE_TEXT};
            --badge-live-start: ${COLORS.BADGE.LIVE_GRADIENT_START};
            --badge-live-end: ${COLORS.BADGE.LIVE_GRADIENT_END};
            --chain-arbitrum-bg: ${COLORS.CHAIN.ARBITRUM.BG};
            --chain-arbitrum-text: ${COLORS.CHAIN.ARBITRUM.TEXT};
            --chain-arbitrum-border: ${COLORS.CHAIN.ARBITRUM.BORDER};
            --chain-ethereum-bg: ${COLORS.CHAIN.ETHEREUM.BG};
            --chain-ethereum-text: ${COLORS.CHAIN.ETHEREUM.TEXT};
            --chain-ethereum-border: ${COLORS.CHAIN.ETHEREUM.BORDER};
            --border-light: ${COLORS.BORDER.LIGHT};
            --border-default: ${COLORS.BORDER.DEFAULT};
            --bg-solid-white: ${COLORS.BACKGROUND_SOLID.WHITE};
            --bg-solid-header: ${COLORS.BACKGROUND_SOLID.HEADER};
            --bg-solid-hover: ${COLORS.BACKGROUND_SOLID.HOVER};
            --bg-solid-gradient-start: ${COLORS.BACKGROUND_SOLID.GRADIENT_START};
            --bg-solid-gradient-end: ${COLORS.BACKGROUND_SOLID.GRADIENT_END};
            --indicator-bg-success: ${COLORS.INDICATOR_BG.SUCCESS};
            --indicator-bg-info: ${COLORS.INDICATOR_BG.INFO};
            --indicator-bg-error: ${COLORS.INDICATOR_BG.ERROR};
            --indicator-bg-warning: ${COLORS.INDICATOR_BG.WARNING};
            --shadow-default: ${COLORS.SHADOW.DEFAULT};
            --shadow-card: ${COLORS.SHADOW.CARD};
            --shadow-text: ${COLORS.SHADOW.TEXT};
            --logo-filter: brightness(0) invert(1);
            --glass-bg: linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03));
            --glass-hover-bg: linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.05));
            --glass-border: rgba(255, 255, 255, 0.1);
            --glass-hover-border: rgba(255, 255, 255, 0.2);
            --glass-text-color: rgba(255, 255, 255, 0.95);
            --glass-label-color: rgba(255, 255, 255, 0.8);
            --glass-inset-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1);
            --glass-hover-inset-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.15);
            --glass-box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            --glass-hover-box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
        }

        /* Light theme */
        [data-theme="light"] {
            --bg-primary-start: ${LIGHT_COLORS.BACKGROUND.PRIMARY_START};
            --bg-primary-end: ${LIGHT_COLORS.BACKGROUND.PRIMARY_END};
            --text-white: ${LIGHT_COLORS.TEXT.WHITE};
            --text-primary: ${LIGHT_COLORS.TEXT.PRIMARY};
            --text-secondary: ${LIGHT_COLORS.TEXT.SECONDARY};
            --text-muted: ${LIGHT_COLORS.TEXT.MUTED};
            --text-light: ${LIGHT_COLORS.TEXT.LIGHT};
            --text-lighter: ${LIGHT_COLORS.TEXT.LIGHTER};
            --status-success: ${LIGHT_COLORS.STATUS.SUCCESS};
            --status-error: ${LIGHT_COLORS.STATUS.ERROR};
            --status-neutral: ${LIGHT_COLORS.STATUS.NEUTRAL};
            --status-info: ${LIGHT_COLORS.STATUS.INFO};
            --status-warning: ${LIGHT_COLORS.STATUS.WARNING};
            --status-current: ${LIGHT_COLORS.STATUS.CURRENT};
            --badge-default-bg: ${LIGHT_COLORS.BADGE.DEFAULT_BG};
            --badge-default-text: ${LIGHT_COLORS.BADGE.DEFAULT_TEXT};
            --badge-in-range-bg: ${LIGHT_COLORS.BADGE.IN_RANGE_BG};
            --badge-in-range-text: ${LIGHT_COLORS.BADGE.IN_RANGE_TEXT};
            --badge-out-range-bg: ${LIGHT_COLORS.BADGE.OUT_RANGE_BG};
            --badge-out-range-text: ${LIGHT_COLORS.BADGE.OUT_RANGE_TEXT};
            --badge-live-start: ${LIGHT_COLORS.BADGE.LIVE_GRADIENT_START};
            --badge-live-end: ${LIGHT_COLORS.BADGE.LIVE_GRADIENT_END};
            --chain-arbitrum-bg: ${LIGHT_COLORS.CHAIN.ARBITRUM.BG};
            --chain-arbitrum-text: ${LIGHT_COLORS.CHAIN.ARBITRUM.TEXT};
            --chain-arbitrum-border: ${LIGHT_COLORS.CHAIN.ARBITRUM.BORDER};
            --chain-ethereum-bg: ${LIGHT_COLORS.CHAIN.ETHEREUM.BG};
            --chain-ethereum-text: ${LIGHT_COLORS.CHAIN.ETHEREUM.TEXT};
            --chain-ethereum-border: ${LIGHT_COLORS.CHAIN.ETHEREUM.BORDER};
            --border-light: ${LIGHT_COLORS.BORDER.LIGHT};
            --border-default: ${LIGHT_COLORS.BORDER.DEFAULT};
            --bg-solid-white: ${LIGHT_COLORS.BACKGROUND_SOLID.WHITE};
            --bg-solid-header: ${LIGHT_COLORS.BACKGROUND_SOLID.HEADER};
            --bg-solid-hover: ${LIGHT_COLORS.BACKGROUND_SOLID.HOVER};
            --bg-solid-gradient-start: ${LIGHT_COLORS.BACKGROUND_SOLID.GRADIENT_START};
            --bg-solid-gradient-end: ${LIGHT_COLORS.BACKGROUND_SOLID.GRADIENT_END};
            --indicator-bg-success: ${LIGHT_COLORS.INDICATOR_BG.SUCCESS};
            --indicator-bg-info: ${LIGHT_COLORS.INDICATOR_BG.INFO};
            --indicator-bg-error: ${LIGHT_COLORS.INDICATOR_BG.ERROR};
            --indicator-bg-warning: ${LIGHT_COLORS.INDICATOR_BG.WARNING};
            --shadow-default: ${LIGHT_COLORS.SHADOW.DEFAULT};
            --shadow-card: ${LIGHT_COLORS.SHADOW.CARD};
            --shadow-text: ${LIGHT_COLORS.SHADOW.TEXT};
            --logo-filter: brightness(0) invert(1);
            --glass-bg: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
            --glass-hover-bg: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
            --glass-border: rgba(255, 255, 255, 0.2);
            --glass-hover-border: rgba(255, 255, 255, 0.3);
            --glass-text-color: rgba(255, 255, 255, 0.95);
            --glass-label-color: rgba(255, 255, 255, 0.8);
            --glass-inset-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2);
            --glass-hover-inset-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.3);
            --glass-box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            --glass-hover-box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, var(--bg-primary-start) 0%, var(--bg-primary-end) 100%);
            min-height: 100vh;
            transition: background 0.3s ease;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
        }
        .page-header {
            text-align: center;
            margin-bottom: 10px;
        }
        .uniswap-logo {
            height: 150px;
            margin: 20px auto;
            display: block;
            filter: drop-shadow(var(--shadow-text));
        }
        .uniswap-logo img {
            width: 100%;
            height: 100%;
        }
        h1 {
            color: var(--text-white);
            text-align: center;
            margin: 0;
            font-size: 2.5em;
            text-shadow: var(--shadow-text);
        }
        .timestamp {
            color: var(--text-light);
            text-align: center;
            margin-bottom: 30px;
            font-size: 1.1em;
        }
        .dashboard-glass {
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 20px;
            margin-bottom: 30px;
        }
        .dashboard-glass .glass-card:nth-child(-n+3) {
            grid-column: span 2;
        }
        .dashboard-glass .glass-card:nth-child(4) {
            grid-column: span 3;
        }
        .dashboard-glass .glass-card:nth-child(5) {
            grid-column: span 3;
        }
        .glass-card {
            position: relative;
            background: var(--glass-bg);
            backdrop-filter: blur(15px);
            -webkit-backdrop-filter: blur(15px);
            border: 1px solid var(--glass-border);
            border-radius: 20px;
            padding: 24px 20px;
            text-align: center;
            box-shadow: var(--glass-box-shadow), var(--glass-inset-shadow);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            overflow: hidden;
        }
        .glass-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: var(--glass-hover-bg);
            opacity: 0;
            transition: opacity 0.3s ease;
            border-radius: inherit;
        }
        .glass-card:hover {
            transform: translateY(-5px) scale(1.02);
            box-shadow: var(--glass-hover-box-shadow), var(--glass-hover-inset-shadow);
            border-color: var(--glass-hover-border);
        }
        .glass-card:hover::before {
            opacity: 1;
        }
        .glass-icon {
            font-size: 2.5em;
            margin-bottom: 12px;
            display: block;
            filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
        }
        .glass-icon img {
            width: 40px;
            height: 40px;
            filter: var(--logo-filter) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
        }
        [data-theme="light"] .glass-icon img {
            filter: brightness(0) invert(1) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
        }
        .glass-card .metric-label {
            color: var(--glass-label-color);
            font-size: 0.85em;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }
        .glass-card .metric-value {
            font-size: 1.8em;
            font-weight: 700;
            color: var(--glass-text-color);
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            white-space: nowrap;
        }
        .glass-card .metric-value.positive {
            color: #4ade80;
            text-shadow: 0 0 20px rgba(74, 222, 128, 0.3);
        }
        .glass-card .metric-value.negative {
            color: #f87171;
            text-shadow: 0 0 20px rgba(248, 113, 113, 0.3);
        }
        .glass-card .metric-value.neutral {
            color: #fbbf24;
            text-shadow: 0 0 20px rgba(251, 191, 36, 0.3);
        }
        .metric-percentage {
            font-size: 1em;
            font-weight: 600;
            margin-top: 4px;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }
        .metric-percentage.positive {
            color: #4ade80;
        }
        .metric-percentage.negative {
            color: #f87171;
        }
        .metric-percentage.neutral {
            color: var(--text-lighter);
        }
        [data-theme="light"] .metric-percentage {
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }
        [data-theme="light"] .metric-percentage.positive {
            color: #4ade80;
        }
        [data-theme="light"] .metric-percentage.negative {
            color: #ff6b6b;
        }
        [data-theme="light"] .metric-percentage.neutral {
            color: rgba(255, 255, 255, 0.7);
        }
        .position-card {
            background: var(--bg-solid-white);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 30px;
            box-shadow: var(--shadow-card);
        }
        .table-container {
            overflow-x: auto;
            margin: 0 -20px;
            padding: 0 20px;
        }
        .position-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid var(--border-light);
        }
        .position-title {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 8px;
        }
        .position-top-row {
            display: flex;
            gap: 15px;
            align-items: flex-start;
            width: 100%;
            margin-bottom: 6px;
        }
        .token-pair-logo {
            width: 72px;
            height: 72px;
            flex-shrink: 0;
        }
        .token-pair-logo svg {
            width: 100%;
            height: 100%;
        }
        .position-content {
            flex: 1;
        }
        .position-title-row {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .pair-name {
            font-size: 1.6em;
            font-weight: 600;
            color: var(--text-primary);
        }
        .badge-group {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-top: 8px;
        }
        .protocol-badge {
            background: var(--badge-default-bg);
            color: var(--badge-default-text);
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 0.9em;
            font-weight: 600;
        }
        .fee-badge {
            background: var(--badge-default-bg);
            color: var(--badge-default-text);
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 0.9em;
            font-weight: 600;
        }
        .chain-badge {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 0.9em;
            font-weight: 500;
        }
        .chain-badge.arbitrum {
            background-color: var(--chain-arbitrum-bg);
            color: var(--chain-arbitrum-text);
            border: 1px solid var(--chain-arbitrum-border);
        }
        .chain-badge.ethereum {
            background-color: var(--chain-ethereum-bg);
            color: var(--chain-ethereum-text);
            border: 1px solid var(--chain-ethereum-border);
        }
        .chain-badge img {
            width: 16px;
            height: 16px;
        }
        .position-range {
            font-weight: 500;
            font-size: 0.95em;
            color: var(--text-secondary);
            margin-bottom: 4px;
        }
        .position-id {
            color: var(--text-secondary);
            font-size: 0.85em;
        }
        .position-age {
            color: var(--status-info);
            font-weight: 600;
        }
        .fees-indicators {
            display: flex;
            gap: 12px;
            align-items: center;
        }
        .average-fees-indicator, .total-fees-indicator, .profit-loss-indicator {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 10px 20px;
            border-radius: 8px;
        }
        .average-fees-indicator {
            border: 2px solid var(--status-success);
            background-color: var(--indicator-bg-success);
        }
        .total-fees-indicator {
            border: 2px solid var(--status-info);
            background-color: var(--indicator-bg-info);
        }
        .profit-loss-indicator.positive {
            border: 2px solid var(--status-success);
            background-color: var(--indicator-bg-success);
        }
        .profit-loss-indicator.negative {
            border: 2px solid var(--status-error);
            background-color: var(--indicator-bg-error);
        }
        .profit-loss-indicator.neutral {
            border: 2px solid var(--status-warning);
            background-color: var(--indicator-bg-warning);
        }
        .average-fees-label, .total-fees-label {
            font-size: 0.75em;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
        }
        .profit-loss-label {
            font-size: 0.75em;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
        }
        .average-fees-label {
            color: var(--status-success);
        }
        .total-fees-label {
            color: var(--status-info);
        }
        .profit-loss-label.positive {
            color: var(--status-success);
        }
        .profit-loss-label.negative {
            color: var(--status-error);
        }
        .profit-loss-label.neutral {
            color: var(--status-warning);
        }
        .average-fees-value {
            color: var(--status-success);
            font-size: 1.5em;
            font-weight: 700;
        }
        .total-fees-value {
            color: var(--status-info);
            font-size: 1.5em;
            font-weight: 700;
        }
        .profit-loss-value.positive {
            color: var(--status-success);
            font-size: 1.5em;
            font-weight: 700;
        }
        .profit-loss-value.negative {
            color: var(--status-error);
            font-size: 1.5em;
            font-weight: 700;
        }
        .profit-loss-value.neutral {
            color: var(--status-warning);
            font-size: 1.5em;
            font-weight: 700;
        }
        .profit-loss-percent {
            font-weight: 500;
            opacity: 0.85;
        }
        .total-value {
            font-size: 1.8em;
            font-weight: bold;
            color: var(--status-success);
        }
        table {
            width: 100%;
            border-collapse: collapse;
            min-width: 600px;
            max-width: 100%;
        }
        th {
            background: var(--bg-solid-header);
            color: var(--text-muted);
            padding: 10px 6px;
            text-align: left;
            font-weight: 600;
            font-size: 0.85em;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            white-space: nowrap;
            border-bottom: 2px solid var(--border-default);
        }
        th:first-child {
            border-top-left-radius: 6px;
        }
        th:last-child {
            border-top-right-radius: 6px;
        }
        th:nth-child(1) { width: 15%; min-width: 100px; } /* Date */
        th:nth-child(2) { width: 15%; min-width: 80px; } /* 24h Fees */
        th:nth-child(3) { width: 20%; min-width: 100px; } /* Total Value */
        th:nth-child(4) { width: 18%; min-width: 100px; } /* Current Price */
        th:nth-child(5) { width: 12%; min-width: 80px; } /* Status */
        td {
            padding: 8px 6px;
            border-bottom: 1px solid var(--border-light);
            color: var(--text-primary);
            font-size: 0.85em;
            white-space: nowrap;
        }
        td:nth-child(1) { width: 15%; min-width: 100px; } /* Date */
        td:nth-child(2) { width: 15%; min-width: 80px; } /* 24h Fees */
        td:nth-child(3) { width: 20%; min-width: 100px; } /* Total Value */
        td:nth-child(4) { width: 18%; min-width: 100px; } /* Current Price */
        td:nth-child(5) { width: 12%; min-width: 80px; } /* Status */
        tr:last-child td {
            border-bottom: none;
        }
        tr:hover {
            background-color: var(--bg-solid-hover);
        }
        .current-state-row {
            background: linear-gradient(90deg, rgba(255, 204, 0, 0.15) 0%, rgba(255, 159, 10, 0.10) 100%);
            border-top: 2px solid var(--status-current);
            border-bottom: 2px solid var(--status-current);
            font-weight: 600;
            position: relative;
        }
        .current-state-row:hover {
            background: linear-gradient(90deg, rgba(255, 204, 0, 0.20) 0%, rgba(255, 159, 10, 0.15) 100%);
        }
        .current-state-row td {
            padding: 12px 6px;
            border-bottom: none;
        }
        .current-state-row td:first-child {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .live-badge {
            background: linear-gradient(135deg, var(--badge-live-start) 0%, var(--badge-live-end) 100%);
            color: white;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 0.75em;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            animation: pulse 2s infinite;
            box-shadow: 0 2px 4px rgba(255, 107, 107, 0.3);
        }
        .live-time {
            color: var(--text-secondary);
            font-size: 0.9em;
            font-weight: 500;
        }
        @keyframes pulse {
            0% {
                box-shadow: 0 2px 4px rgba(255, 107, 107, 0.3);
            }
            50% {
                box-shadow: 0 2px 8px rgba(255, 107, 107, 0.5);
            }
            100% {
                box-shadow: 0 2px 4px rgba(255, 107, 107, 0.3);
            }
        }
        .metric-label {
            color: var(--text-secondary);
            font-weight: 500;
        }
        .metric-value {
            font-weight: 600;
            color: var(--text-primary);
        }
        .in-range {
            color: var(--status-success);
            font-weight: 600;
        }
        .out-range {
            color: var(--status-error);
            font-weight: 600;
        }
        .status-badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 0.85em;
            font-weight: 600;
        }
        .status-in-range {
            background-color: var(--badge-in-range-bg);
            color: var(--badge-in-range-text);
        }
        .status-out-range {
            background-color: var(--badge-out-range-bg);
            color: var(--badge-out-range-text);
        }
        .fees-total {
            color: var(--status-info);
            font-weight: 700;
            font-size: 1.1em;
        }
        .fees-24h {
            color: var(--status-success);
            font-weight: 700;
            font-size: 1.1em;
        }
        .fees-24h-negative {
            color: var(--status-error);
            font-weight: 700;
            font-size: 1.1em;
        }
        .price-change-positive {
            color: var(--status-success);
            font-weight: 600;
        }
        .price-change-negative {
            color: var(--status-error);
            font-weight: 600;
        }
        .price-change-neutral {
            color: var(--status-neutral);
            font-weight: 600;
        }
        .summary-row {
            background: linear-gradient(to right, var(--bg-solid-gradient-start), var(--bg-solid-gradient-end));
            font-weight: 600;
        }
        .footer {
            text-align: center;
            color: var(--text-lighter);
            margin-top: 40px;
            font-size: 0.9em;
        }
        /* Theme toggle button */
        .theme-toggle {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            background: var(--glass-bg);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border: 1px solid var(--glass-border);
            border-radius: 12px;
            padding: 10px;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        .theme-toggle:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
            border-color: var(--glass-hover-border);
        }
        .theme-toggle img {
            width: 24px;
            height: 24px;
            display: block;
            filter: var(--logo-filter);
            transition: filter 0.3s ease;
        }
        .theme-toggle:hover img {
            filter: var(--logo-filter) brightness(1.2);
        }
        .theme-toggle-icon {
            display: none !important;
        }
        .theme-toggle-icon.active {
            display: block !important;
        }
        @media (max-width: 768px) {
            body {
                padding: 10px;
            }
            h1 {
                font-size: 1.8em;
            }
            .position-header {
                flex-direction: column;
                align-items: stretch;
            }
            .fees-indicators {
                margin-top: 12px;
                display: flex;
                gap: 6px;
                flex-wrap: nowrap;
                overflow-x: auto;
                width: 100%;
            }
            .average-fees-indicator, .total-fees-indicator, .profit-loss-indicator {
                padding: 6px 8px;
                flex-direction: column;
                justify-content: center;
                flex: 1;
                min-width: 0;
            }
            .average-fees-label, .total-fees-label, .profit-loss-label {
                margin-bottom: 3px;
                margin-right: 0;
                white-space: nowrap;
            }
            .average-fees-value, .total-fees-value {
                font-size: 1em;
            }
            .profit-loss-value.positive, .profit-loss-value.negative, .profit-loss-value.neutral {
                font-size: 1em;
            }
            .position-title {
                flex-wrap: wrap;
                gap: 6px;
            }
            .position-id {
                font-size: 0.85em;
            }
            .total-value {
                margin-top: 10px;
            }
            th, td {
                padding: 8px;
            }
            .dashboard-glass {
                grid-template-columns: 1fr 1fr;
                gap: 12px;
                margin-bottom: 20px;
            }
            .dashboard-glass .glass-card:nth-child(-n+3) {
                grid-column: span 1;
            }
            .dashboard-glass .glass-card:nth-child(4) {
                grid-column: span 1;
            }
            .dashboard-glass .glass-card:nth-child(5) {
                grid-column: span 2;
            }
            .glass-card {
                padding: 16px 12px;
                border-radius: 16px;
            }
            .glass-icon {
                font-size: 1.8em;
                margin-bottom: 6px;
            }
            .glass-icon img {
                width: 36px;
                height: 36px;
            }
            .glass-card .metric-label {
                font-size: 0.75em;
                margin-bottom: 6px;
            }
            .glass-card .metric-value {
                font-size: 1.3em;
            }
            .metric-percentage {
                font-size: 0.85em;
                margin-top: 2px;
            }
            .glass-card:hover {
                transform: translateY(-2px) scale(1.01);
            }
            .theme-toggle {
                top: 10px;
                right: 10px;
                padding: 8px;
            }
            .theme-toggle img {
                width: 20px;
                height: 20px;
            }
        }`;
};
