
const totalTests = document.querySelector("#total-tests");
const averageTime = document.querySelector("#average-time");
const averageSpeed = document.querySelector("#average-speed");
const latestTime = document.querySelector("#latest-time");
const responseChart = document.querySelector("#response-chart");
const historyBody = document.querySelector("#history-body");
const statusMessage = document.querySelector("#status-message");
const lastUpdated = document.querySelector("#last-updated");
const refreshButton = document.querySelector("#refresh-button");

function formatSeconds(value) {
    return `${Number(value).toFixed(2)} s`;
}

function formatSpeed(value) {
    return `${Number(value).toFixed(2)} tok/s`;
}

function formatDate(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value || "—";
    }

    return new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "medium",
    }).format(date);
}

function createCell(value) {
    const cell = document.createElement("td");
    cell.textContent = value;
    return cell;
}

function renderHistory(results) {
    historyBody.replaceChildren();

    if (results.length === 0) {
        const row = document.createElement("tr");
        const cell = createCell("Nenhum teste registrado ainda.");
        cell.colSpan = 5;
        row.appendChild(cell);
        historyBody.appendChild(row);
        return;
    }

    const orderedResults = [...results].reverse();

    for (const result of orderedResults) {
        const row = document.createElement("tr");

        row.appendChild(createCell(formatDate(result.timestamp)));
        row.appendChild(createCell(formatSeconds(result.response_seconds)));
        row.appendChild(createCell(String(result.generated_tokens ?? "—")));
        row.appendChild(
            createCell(
                result.generation_tokens_per_second == null
                    ? "—"
                    : formatSpeed(result.generation_tokens_per_second)
            )
        );
        row.appendChild(
            createCell(
                result.load_seconds == null
                    ? "—"
                    : formatSeconds(result.load_seconds)
            )
        );

        historyBody.appendChild(row);
    }
}

function renderChart(results) {
    responseChart.replaceChildren();

    if (results.length === 0) {
        responseChart.textContent = "Ainda não existem dados para exibir.";
        return;
    }

    const recentResults = results.slice(-8);
    const maxTime = Math.max(
        ...recentResults.map((result) => Number(result.response_seconds) || 0),
        0.1
    );

    const chartList = document.createElement("div");
    chartList.className = "chart-list";

    recentResults.forEach((result, index) => {
        const row = document.createElement("div");
        row.className = "chart-row";

        const label = document.createElement("span");
        label.className = "chart-label";
        label.textContent = `Teste ${results.length - recentResults.length + index + 1}`;

        const track = document.createElement("div");
        track.className = "chart-track";
        track.setAttribute("aria-hidden", "true");

        const bar = document.createElement("div");
        bar.className = "chart-bar";

        const seconds = Math.max(0, Number(result.response_seconds) || 0);
        bar.style.width = `${(seconds / maxTime) * 100}%`;
        track.appendChild(bar);

        const value = document.createElement("span");
        value.className = "chart-value";
        value.textContent = formatSeconds(seconds);

        row.append(label, track, value);
        chartList.appendChild(row);
    });

    responseChart.appendChild(chartList);
}

function renderMetrics(results) {
    totalTests.textContent = String(results.length);

    if (results.length === 0) {
        averageTime.textContent = "—";
        averageSpeed.textContent = "—";
        latestTime.textContent = "—";
        return;
    }

    const times = results
        .map((result) => Number(result.response_seconds))
        .filter(Number.isFinite);

    const speeds = results
        .map((result) => Number(result.generation_tokens_per_second))
        .filter(Number.isFinite);

    const meanTime = times.length
        ? times.reduce((sum, value) => sum + value, 0) / times.length
        : null;

    const meanSpeed = speeds.length
        ? speeds.reduce((sum, value) => sum + value, 0) / speeds.length
        : null;

    averageTime.textContent =
        meanTime === null ? "—" : formatSeconds(meanTime);

    averageSpeed.textContent =
        meanSpeed === null ? "—" : formatSpeed(meanSpeed);

    const lastResult = results[results.length - 1];
    latestTime.textContent =
        lastResult.response_seconds == null
            ? "—"
            : formatSeconds(lastResult.response_seconds);
}

async function loadBenchmark() {
    refreshButton.disabled = true;
    statusMessage.textContent = "Carregando resultados do servidor...";

    try {
        const response = await fetch("/api/benchmark", {
            cache: "no-store",
        });

        if (!response.ok) {
            throw new Error(`Erro HTTP ${response.status}`);
        }

        const data = await response.json();

        if (!Array.isArray(data.results)) {
            throw new Error("Formato de resposta inesperado.");
        }

        renderMetrics(data.results);
        renderChart(data.results);
        renderHistory(data.results);

        statusMessage.textContent =
            `${data.results.length} teste(s) carregado(s) da API local.`;

	lastUpdated.textContent =
    	    `Última atualização: ${new Intl.DateTimeFormat("pt-BR", {
                dateStyle: "short",
                timeStyle: "medium",
            }).format(new Date())}`;

    } catch (error) {
        console.error("Falha ao carregar o benchmark:", error);
        statusMessage.textContent =
            "Não foi possível carregar os resultados. Verifique se a API está disponível.";

        responseChart.textContent = "Gráfico indisponível.";
        historyBody.replaceChildren();

        const row = document.createElement("tr");
        const cell = createCell("Falha ao consultar o histórico.");
        cell.colSpan = 5;
        row.appendChild(cell);
        historyBody.appendChild(row);
    } finally {
        refreshButton.disabled = false;
    }
}

refreshButton.addEventListener("click", loadBenchmark);
loadBenchmark();
