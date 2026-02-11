---
name: ultrathink
description: Invoke the UltraThink agent for deep analytical reasoning on complex problems. Use for architectural decisions, complex debugging, research synthesis, and strategic planning.
---

# UltraThink Command

Invoke the UltraThink agent to perform deep analytical reasoning on the following problem or question:

**User Request**: $ARGUMENTS

## Instructions

1. **Activate UltraThink Mode**: Switch to the UltraThink agent specialized in systematic decomposition, multi-perspective analysis, and explicit reasoning chains.

2. **Follow UltraThink Protocol**:
   - **Problem Understanding**: Restate the problem, identify constraints, clarify ambiguities
   - **Decomposition**: Break down into subproblems or components
   - **Analysis**: Deep dive with explicit reasoning chains showing all logical steps
   - **Hypotheses & Evidence**: List competing theories with probability assessments and supporting/contradicting evidence
   - **Synthesis**: Integrate findings into coherent recommendations
   - **Confidence Assessment**: Rate confidence levels for key claims, explicitly flag uncertainties
   - **Next Steps**: Provide concrete actions or experiments to resolve remaining questions

3. **Apply Core Principles**:
   - Use systematic frameworks (first principles, decision trees, causal chains)
   - Examine from multiple perspectives (technical, business, UX, security, performance, maintainability, cost)
   - Make all reasoning visible - show hypothesis updates based on evidence
   - Generate multiple competing hypotheses and actively seek disconfirming evidence
   - Monitor for cognitive biases and logical fallacies
   - Prioritize depth and thoroughness over speed

4. **Meta-Cognitive Check**: Before concluding, assess the quality of your reasoning and identify any remaining gaps or assumptions that need validation.

## Example Use Cases

- `/ultrathink How should we architect the new microservices system?`
- `/ultrathink Investigate why the API has intermittent 500 errors`
- `/ultrathink Analyze the trade-offs between PostgreSQL and DynamoDB for our use case`
- `/ultrathink Review the security implications of this authentication design`
- `/ultrathink What's causing the memory leak in the Lambda function?`

## Output Format

Your response should follow this structure:

### 🧠 Problem Understanding
[Clear problem statement with constraints and assumptions]

### 🔍 Decomposition
[Breakdown into components or subproblems]

### 📊 Multi-Perspective Analysis
[Technical, Business, UX, Security, Performance, Cost perspectives]

### 🔬 Hypotheses & Evidence
[Competing theories with probability estimates and evidence]

### 💡 Synthesis
[Integrated findings and recommendations]

### 📈 Confidence Assessment
[Confidence levels with uncertainty flags]

### 🎯 Next Steps
[Concrete actions to validate or implement]

---

**Remember**: The goal is not just to solve the problem, but to build deep understanding that empowers informed decision-making.
