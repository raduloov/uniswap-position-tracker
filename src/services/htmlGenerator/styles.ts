import { COLORS } from "../../constants/colors";

export const generateStyles = (): string => {
  return `
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, ${COLORS.BACKGROUND.PRIMARY_START} 0%, ${COLORS.BACKGROUND.PRIMARY_END} 100%);
            min-height: 100vh;
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
            filter: drop-shadow(${COLORS.SHADOW.TEXT});
        }
        .uniswap-logo img {
            width: 100%;
            height: 100%;
        }
        h1 {
            color: ${COLORS.TEXT.WHITE};
            text-align: center;
            margin: 0;
            font-size: 2.5em;
            text-shadow: ${COLORS.SHADOW.TEXT};
        }
        .timestamp {
            color: ${COLORS.TEXT.LIGHT};
            text-align: center;
            margin-bottom: 30px;
            font-size: 1.1em;
        }
        .position-card {
            background: ${COLORS.BACKGROUND_SOLID.WHITE};
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 30px;
            box-shadow: ${COLORS.SHADOW.CARD};
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
            border-bottom: 2px solid ${COLORS.BORDER.LIGHT};
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
        .mock-token-logo {
            width: 52px;
            height: 52px;
            border-radius: 50%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
        }
        .mock-token-logo span {
            color: white;
            font-weight: bold;
            font-size: 16px;
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
            font-size: 1.2em;
            font-weight: 600;
            color: ${COLORS.TEXT.PRIMARY};
        }
        .badge-group {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .protocol-badge {
            background: ${COLORS.BADGE.DEFAULT_BG};
            color: ${COLORS.BADGE.DEFAULT_TEXT};
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 0.75em;
            font-weight: 600;
        }
        .fee-badge {
            background: ${COLORS.BADGE.DEFAULT_BG};
            color: ${COLORS.BADGE.DEFAULT_TEXT};
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 0.75em;
            font-weight: 600;
        }
        .chain-row {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-top: 4px;
        }
        .chain-badge {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 0.7em;
            font-weight: 500;
        }
        .chain-badge.arbitrum {
            background-color: #f0f9ff;
            color: #213147;
            border: 1px solid #21314720;
        }
        .chain-badge.ethereum {
            background-color: #f5f5ff;
            color: #627EEA;
            border: 1px solid #627EEA20;
        }
        .chain-badge img {
            width: 12px;
            height: 12px;
        }
        .position-range {
            font-weight: 500;
            font-size: 0.95em;
            color: ${COLORS.TEXT.SECONDARY};
            margin-bottom: 4px;
        }
        .position-id {
            color: ${COLORS.TEXT.SECONDARY};
            font-size: 0.85em;
        }
        .position-age {
            color: ${COLORS.STATUS.INFO};
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
            border: 2px solid ${COLORS.STATUS.SUCCESS};
            background-color: ${COLORS.INDICATOR_BG.SUCCESS};
        }
        .total-fees-indicator {
            border: 2px solid ${COLORS.STATUS.INFO};
            background-color: ${COLORS.INDICATOR_BG.INFO};
        }
        .profit-loss-indicator.positive {
            border: 2px solid ${COLORS.STATUS.SUCCESS};
            background-color: ${COLORS.INDICATOR_BG.SUCCESS};
        }
        .profit-loss-indicator.negative {
            border: 2px solid ${COLORS.STATUS.ERROR};
            background-color: ${COLORS.INDICATOR_BG.ERROR};
        }
        .profit-loss-indicator.neutral {
            border: 2px solid ${COLORS.STATUS.WARNING};
            background-color: ${COLORS.INDICATOR_BG.WARNING};
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
            color: ${COLORS.STATUS.SUCCESS};
        }
        .total-fees-label {
            color: ${COLORS.STATUS.INFO};
        }
        .profit-loss-label.positive {
            color: ${COLORS.STATUS.SUCCESS};
        }
        .profit-loss-label.negative {
            color: ${COLORS.STATUS.ERROR};
        }
        .profit-loss-label.neutral {
            color: ${COLORS.STATUS.WARNING};
        }
        .average-fees-value {
            color: ${COLORS.STATUS.SUCCESS};
            font-size: 1.5em;
            font-weight: 700;
        }
        .total-fees-value {
            color: ${COLORS.STATUS.INFO};
            font-size: 1.5em;
            font-weight: 700;
        }
        .profit-loss-value.positive {
            color: ${COLORS.STATUS.SUCCESS};
            font-size: 1.5em;
            font-weight: 700;
        }
        .profit-loss-value.negative {
            color: ${COLORS.STATUS.ERROR};
            font-size: 1.5em;
            font-weight: 700;
        }
        .profit-loss-value.neutral {
            color: ${COLORS.STATUS.WARNING};
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
            color: ${COLORS.STATUS.SUCCESS};
        }
        table {
            width: 100%;
            border-collapse: collapse;
            min-width: 600px;
            max-width: 100%;
        }
        th {
            background: ${COLORS.BACKGROUND_SOLID.HEADER};
            color: ${COLORS.TEXT.MUTED};
            padding: 10px 6px;
            text-align: left;
            font-weight: 600;
            font-size: 0.85em;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            white-space: nowrap;
            border-bottom: 2px solid ${COLORS.BORDER.DEFAULT};
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
            border-bottom: 1px solid ${COLORS.BORDER.LIGHT};
            color: ${COLORS.TEXT.PRIMARY};
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
            background-color: ${COLORS.BACKGROUND_SOLID.HOVER};
        }
        .metric-label {
            color: ${COLORS.TEXT.SECONDARY};
            font-weight: 500;
        }
        .metric-value {
            font-weight: 600;
            color: ${COLORS.TEXT.PRIMARY};
        }
        .in-range {
            color: ${COLORS.STATUS.SUCCESS};
            font-weight: 600;
        }
        .out-range {
            color: ${COLORS.STATUS.ERROR};
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
            background-color: ${COLORS.BADGE.IN_RANGE_BG};
            color: ${COLORS.BADGE.IN_RANGE_TEXT};
        }
        .status-out-range {
            background-color: ${COLORS.BADGE.OUT_RANGE_BG};
            color: ${COLORS.BADGE.OUT_RANGE_TEXT};
        }
        .fees-total {
            color: ${COLORS.STATUS.INFO};
            font-weight: 700;
            font-size: 1.1em;
        }
        .fees-24h {
            color: ${COLORS.STATUS.SUCCESS};
            font-weight: 700;
            font-size: 1.1em;
        }
        .price-change-positive {
            color: ${COLORS.STATUS.SUCCESS};
            font-weight: 600;
        }
        .price-change-negative {
            color: ${COLORS.STATUS.ERROR};
            font-weight: 600;
        }
        .price-change-neutral {
            color: ${COLORS.STATUS.NEUTRAL};
            font-weight: 600;
        }
        .summary-row {
            background: linear-gradient(to right, ${COLORS.BACKGROUND_SOLID.GRADIENT_START}, ${COLORS.BACKGROUND_SOLID.GRADIENT_END});
            font-weight: 600;
        }
        .footer {
            text-align: center;
            color: ${COLORS.TEXT.LIGHTER};
            margin-top: 40px;
            font-size: 0.9em;
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
            .pair-name {
                font-size: 1.3em;
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
        }`;
};
