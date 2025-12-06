'use client';

// Sequence diagram showing the data flow
export function SequenceDiagram() {
  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox="0 0 800 400" className="w-full max-w-3xl mx-auto" style={{ minWidth: '600px' }}>
        {/* Background */}
        <rect width="800" height="400" fill="#FAFAF9" rx="12" />

        {/* Title */}
        <text x="400" y="30" textAnchor="middle" className="text-sm font-semibold" fill="#0D0D0D">
          Data Flow: From Question to Analytics
        </text>

        {/* Actors */}
        <g>
          {/* User */}
          <circle cx="100" cy="80" r="24" fill="#E8E7E3" />
          <text x="100" y="85" textAnchor="middle" fontSize="12" fill="#5D5D5D">👤</text>
          <text x="100" y="120" textAnchor="middle" fontSize="11" fill="#0D0D0D" fontWeight="500">Learner</text>
          <line x1="100" y1="130" x2="100" y2="370" stroke="#D9D8D4" strokeWidth="2" strokeDasharray="4,4" />
        </g>

        <g>
          {/* Claude */}
          <circle cx="300" cy="80" r="24" fill="#DA7756" />
          <text x="300" y="85" textAnchor="middle" fontSize="12" fill="white">✦</text>
          <text x="300" y="120" textAnchor="middle" fontSize="11" fill="#0D0D0D" fontWeight="500">Claude</text>
          <line x1="300" y1="130" x2="300" y2="370" stroke="#D9D8D4" strokeWidth="2" strokeDasharray="4,4" />
        </g>

        <g>
          {/* MCQMCP */}
          <rect x="460" y="56" width="80" height="48" rx="8" fill="#7C3AED" />
          <text x="500" y="85" textAnchor="middle" fontSize="10" fill="white" fontWeight="500">MCQMCP</text>
          <text x="500" y="120" textAnchor="middle" fontSize="11" fill="#0D0D0D" fontWeight="500">Server</text>
          <line x1="500" y1="130" x2="500" y2="370" stroke="#D9D8D4" strokeWidth="2" strokeDasharray="4,4" />
        </g>

        <g>
          {/* Analytics */}
          <rect x="660" y="56" width="80" height="48" rx="8" fill="#059669" />
          <text x="700" y="80" textAnchor="middle" fontSize="10" fill="white" fontWeight="500">Analytics</text>
          <text x="700" y="92" textAnchor="middle" fontSize="10" fill="white" fontWeight="500">+ Storage</text>
          <text x="700" y="120" textAnchor="middle" fontSize="11" fill="#0D0D0D" fontWeight="500">Data</text>
          <line x1="700" y1="130" x2="700" y2="370" stroke="#D9D8D4" strokeWidth="2" strokeDasharray="4,4" />
        </g>

        {/* Arrows and labels */}
        {/* 1. User asks */}
        <g>
          <line x1="100" y1="160" x2="280" y2="160" stroke="#0D0D0D" strokeWidth="2" markerEnd="url(#arrowhead)" />
          <rect x="140" y="145" width="100" height="20" rx="4" fill="white" />
          <text x="190" y="159" textAnchor="middle" fontSize="10" fill="#5D5D5D">"Quiz me"</text>
          <circle cx="80" cy="160" r="10" fill="#E8E7E3" />
          <text x="80" y="164" textAnchor="middle" fontSize="8" fill="#5D5D5D">1</text>
        </g>

        {/* 2. Claude calls MCP */}
        <g>
          <line x1="300" y1="190" x2="480" y2="190" stroke="#DA7756" strokeWidth="2" markerEnd="url(#arrowhead-orange)" />
          <rect x="340" y="175" width="100" height="20" rx="4" fill="#FDF2EE" />
          <text x="390" y="189" textAnchor="middle" fontSize="10" fill="#DA7756">get_item()</text>
          <circle cx="80" cy="190" r="10" fill="#FDF2EE" />
          <text x="80" y="194" textAnchor="middle" fontSize="8" fill="#DA7756">2</text>
        </g>

        {/* 3. Item returned */}
        <g>
          <line x1="480" y1="220" x2="320" y2="220" stroke="#7C3AED" strokeWidth="2" markerEnd="url(#arrowhead-purple)" />
          <rect x="350" y="205" width="90" height="20" rx="4" fill="#F3E8FF" />
          <text x="395" y="219" textAnchor="middle" fontSize="10" fill="#7C3AED">Item + meta</text>
          <circle cx="80" cy="220" r="10" fill="#F3E8FF" />
          <text x="80" y="224" textAnchor="middle" fontSize="8" fill="#7C3AED">3</text>
        </g>

        {/* 4. MCQ shown */}
        <g>
          <line x1="280" y1="250" x2="120" y2="250" stroke="#0D0D0D" strokeWidth="2" markerEnd="url(#arrowhead)" />
          <rect x="150" y="235" width="80" height="20" rx="4" fill="white" />
          <text x="190" y="249" textAnchor="middle" fontSize="10" fill="#5D5D5D">MCQ Card</text>
          <circle cx="80" cy="250" r="10" fill="#E8E7E3" />
          <text x="80" y="254" textAnchor="middle" fontSize="8" fill="#5D5D5D">4</text>
        </g>

        {/* 5. User answers */}
        <g>
          <line x1="100" y1="280" x2="280" y2="280" stroke="#0D0D0D" strokeWidth="2" markerEnd="url(#arrowhead)" />
          <rect x="150" y="265" width="60" height="20" rx="4" fill="white" />
          <text x="180" y="279" textAnchor="middle" fontSize="10" fill="#5D5D5D">Click B</text>
          <circle cx="80" cy="280" r="10" fill="#E8E7E3" />
          <text x="80" y="284" textAnchor="middle" fontSize="8" fill="#5D5D5D">5</text>
        </g>

        {/* 6. Log response */}
        <g>
          <line x1="300" y1="310" x2="480" y2="310" stroke="#DA7756" strokeWidth="2" markerEnd="url(#arrowhead-orange)" />
          <rect x="335" y="295" width="110" height="20" rx="4" fill="#FDF2EE" />
          <text x="390" y="309" textAnchor="middle" fontSize="10" fill="#DA7756">log_response()</text>
          <circle cx="80" cy="310" r="10" fill="#FDF2EE" />
          <text x="80" y="314" textAnchor="middle" fontSize="8" fill="#DA7756">6</text>
        </g>

        {/* 7. Store data */}
        <g>
          <line x1="500" y1="340" x2="680" y2="340" stroke="#059669" strokeWidth="2" markerEnd="url(#arrowhead-green)" />
          <rect x="545" y="325" width="90" height="20" rx="4" fill="#D1FAE5" />
          <text x="590" y="339" textAnchor="middle" fontSize="10" fill="#059669">Store + analyze</text>
          <circle cx="80" cy="340" r="10" fill="#D1FAE5" />
          <text x="80" y="344" textAnchor="middle" fontSize="8" fill="#059669">7</text>
        </g>

        {/* Arrow markers */}
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#0D0D0D" />
          </marker>
          <marker id="arrowhead-orange" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#DA7756" />
          </marker>
          <marker id="arrowhead-purple" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#7C3AED" />
          </marker>
          <marker id="arrowhead-green" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#059669" />
          </marker>
        </defs>
      </svg>
    </div>
  );
}

// Architecture diagram
export function ArchitectureDiagram() {
  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox="0 0 700 320" className="w-full max-w-2xl mx-auto" style={{ minWidth: '500px' }}>
        {/* Background */}
        <rect width="700" height="320" fill="#FAFAF9" rx="12" />

        {/* Your Clone box */}
        <g>
          <rect x="40" y="40" width="200" height="100" rx="12" fill="white" stroke="#E8E7E3" strokeWidth="2" />
          <text x="140" y="70" textAnchor="middle" fontSize="14" fontWeight="600" fill="#0D0D0D">Your Clone</text>
          <text x="140" y="90" textAnchor="middle" fontSize="11" fill="#5D5D5D">(Claude Chat Interface)</text>

          {/* MCQ Card icon */}
          <rect x="70" y="105" width="50" height="25" rx="4" fill="#F5F4F1" stroke="#E8E7E3" />
          <text x="95" y="122" textAnchor="middle" fontSize="8" fill="#5D5D5D">MCQ</text>

          {/* Parser icon */}
          <rect x="130" y="105" width="50" height="25" rx="4" fill="#F5F4F1" stroke="#E8E7E3" />
          <text x="155" y="122" textAnchor="middle" fontSize="8" fill="#5D5D5D">Parser</text>
        </g>

        {/* MCP Protocol arrow */}
        <g>
          <line x1="240" y1="90" x2="320" y2="90" stroke="#DA7756" strokeWidth="3" />
          <polygon points="320,85 330,90 320,95" fill="#DA7756" />
          <line x1="330" y1="90" x2="400" y2="90" stroke="#DA7756" strokeWidth="3" />

          <rect x="260" y="70" width="80" height="20" rx="4" fill="#FDF2EE" />
          <text x="300" y="84" textAnchor="middle" fontSize="9" fill="#DA7756" fontWeight="500">MCP Protocol</text>
        </g>

        {/* MCQMCP Server box */}
        <g>
          <rect x="400" y="20" width="260" height="180" rx="12" fill="#7C3AED" fillOpacity="0.1" stroke="#7C3AED" strokeWidth="2" />
          <text x="530" y="50" textAnchor="middle" fontSize="14" fontWeight="600" fill="#7C3AED">MCQMCP Server</text>

          {/* Tools section */}
          <rect x="420" y="65" width="100" height="60" rx="8" fill="white" stroke="#E8E7E3" />
          <text x="470" y="85" textAnchor="middle" fontSize="10" fontWeight="500" fill="#0D0D0D">Tools</text>
          <text x="470" y="100" textAnchor="middle" fontSize="8" fill="#5D5D5D">get_item</text>
          <text x="470" y="112" textAnchor="middle" fontSize="8" fill="#5D5D5D">log_response</text>

          {/* Data section */}
          <rect x="540" y="65" width="100" height="60" rx="8" fill="white" stroke="#E8E7E3" />
          <text x="590" y="85" textAnchor="middle" fontSize="10" fontWeight="500" fill="#0D0D0D">Data</text>
          <text x="590" y="100" textAnchor="middle" fontSize="8" fill="#5D5D5D">Item Banks</text>
          <text x="590" y="112" textAnchor="middle" fontSize="8" fill="#5D5D5D">Response Logs</text>

          {/* Analytics section */}
          <rect x="420" y="135" width="220" height="50" rx="8" fill="#059669" fillOpacity="0.1" stroke="#059669" />
          <text x="530" y="155" textAnchor="middle" fontSize="10" fontWeight="500" fill="#059669">Analytics Engine</text>
          <text x="530" y="170" textAnchor="middle" fontSize="8" fill="#059669">p-value • discrimination • mastery</text>
        </g>

        {/* Content Out / Data Back labels */}
        <g>
          <rect x="40" y="240" width="280" height="50" rx="8" fill="#E8E7E3" fillOpacity="0.5" />
          <text x="180" y="265" textAnchor="middle" fontSize="12" fill="#5D5D5D">📤 CONTENT OUT</text>
          <text x="180" y="280" textAnchor="middle" fontSize="9" fill="#8E8E8E">Validated items with metadata</text>
        </g>

        <g>
          <rect x="380" y="240" width="280" height="50" rx="8" fill="#059669" fillOpacity="0.1" />
          <text x="520" y="265" textAnchor="middle" fontSize="12" fill="#059669">📥 DATA BACK</text>
          <text x="520" y="280" textAnchor="middle" fontSize="9" fill="#059669">Responses, latency, analytics</text>
        </g>

        {/* Bidirectional arrow */}
        <line x1="320" y1="265" x2="380" y2="265" stroke="#5D5D5D" strokeWidth="2" strokeDasharray="4,4" />
      </svg>
    </div>
  );
}

// Value loop diagram
export function ValueLoopDiagram() {
  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox="0 0 500 300" className="w-full max-w-lg mx-auto" style={{ minWidth: '400px' }}>
        {/* Background */}
        <rect width="500" height="300" fill="#FAFAF9" rx="12" />

        {/* Title */}
        <text x="250" y="30" textAnchor="middle" fontSize="14" fontWeight="600" fill="#0D0D0D">
          The Measurement Loop
        </text>

        {/* Item Bank */}
        <g>
          <rect x="40" y="80" width="120" height="60" rx="10" fill="#7C3AED" fillOpacity="0.15" stroke="#7C3AED" strokeWidth="2" />
          <text x="100" y="105" textAnchor="middle" fontSize="11" fontWeight="500" fill="#7C3AED">Item Bank</text>
          <text x="100" y="120" textAnchor="middle" fontSize="9" fill="#7C3AED">Curated questions</text>
        </g>

        {/* Arrow 1 */}
        <g>
          <line x1="160" y1="110" x2="190" y2="110" stroke="#7C3AED" strokeWidth="2" />
          <polygon points="190,105 200,110 190,115" fill="#7C3AED" />
        </g>

        {/* Learner */}
        <g>
          <rect x="200" y="80" width="120" height="60" rx="10" fill="#DA7756" fillOpacity="0.15" stroke="#DA7756" strokeWidth="2" />
          <text x="260" y="105" textAnchor="middle" fontSize="11" fontWeight="500" fill="#DA7756">Learner</text>
          <text x="260" y="120" textAnchor="middle" fontSize="9" fill="#DA7756">Answers questions</text>
        </g>

        {/* Arrow 2 */}
        <g>
          <line x1="320" y1="110" x2="350" y2="110" stroke="#DA7756" strokeWidth="2" />
          <polygon points="350,105 360,110 350,115" fill="#DA7756" />
        </g>

        {/* Response Log */}
        <g>
          <rect x="360" y="80" width="120" height="60" rx="10" fill="#059669" fillOpacity="0.15" stroke="#059669" strokeWidth="2" />
          <text x="420" y="105" textAnchor="middle" fontSize="11" fontWeight="500" fill="#059669">Response Log</text>
          <text x="420" y="120" textAnchor="middle" fontSize="9" fill="#059669">Every answer stored</text>
        </g>

        {/* Arrow 3 - down */}
        <g>
          <line x1="420" y1="140" x2="420" y2="170" stroke="#059669" strokeWidth="2" />
          <polygon points="415,170 420,180 425,170" fill="#059669" />
        </g>

        {/* Analytics */}
        <g>
          <rect x="320" y="180" width="200" height="60" rx="10" fill="#0D0D0D" fillOpacity="0.05" stroke="#0D0D0D" strokeWidth="2" />
          <text x="420" y="205" textAnchor="middle" fontSize="11" fontWeight="500" fill="#0D0D0D">Analytics Engine</text>
          <text x="420" y="220" textAnchor="middle" fontSize="9" fill="#5D5D5D">Difficulty • Discrimination • Mastery</text>
        </g>

        {/* Arrow 4 - back to item bank */}
        <g>
          <path d="M 320 210 Q 250 250 100 170" fill="none" stroke="#0D0D0D" strokeWidth="2" strokeDasharray="4,4" />
          <polygon points="102,165 100,175 108,172" fill="#0D0D0D" />
          <text x="200" y="260" textAnchor="middle" fontSize="9" fill="#5D5D5D">Improves items & selection</text>
        </g>

        {/* Center label */}
        <g>
          <circle cx="250" y="180" r="30" fill="white" stroke="#E8E7E3" strokeWidth="2" />
          <text x="250" y="176" textAnchor="middle" fontSize="10" fill="#5D5D5D">Continuous</text>
          <text x="250" y="188" textAnchor="middle" fontSize="10" fill="#5D5D5D">Learning</text>
        </g>
      </svg>
    </div>
  );
}
