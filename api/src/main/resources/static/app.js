(() => {
    const isServedBySpringBoot =
        (window.location.protocol === "http:" || window.location.protocol === "https:") &&
        window.location.port === "8080";

    const API_BASE_URL = isServedBySpringBoot
        ? "/api/asistencia"
        : "http://localhost:8080/api/asistencia";

    const state = {
        page: 0,
        size: 10,
        totalItems: 0,
        totalPages: 0,
        records: [],
        loading: false
    };

    // Referencias DOM
    const el = {
        apiUrlDisplay: document.getElementById("apiUrlDisplay"),
        apiStatusBadge: document.getElementById("apiStatusBadge"),
        apiStatusText: document.getElementById("apiStatusText"),
        btnRefreshTop: document.getElementById("btnRefreshTop"),

        alertContainer: document.getElementById("alertContainer"),
        alertTitle: document.getElementById("alertTitle"),
        alertMessage: document.getElementById("alertMessage"),
        alertDetails: document.getElementById("alertDetails"),
        btnCloseAlert: document.getElementById("btnCloseAlert"),

        statTotalItems: document.getElementById("statTotalItems"),
        statCurrentPage: document.getElementById("statCurrentPage"),
        statPageIndex: document.getElementById("statPageIndex"),
        statPageCount: document.getElementById("statPageCount"),
        statPageSizeMeta: document.getElementById("statPageSizeMeta"),
        statHttpStatus: document.getElementById("statHttpStatus"),
        statEndpointMeta: document.getElementById("statEndpointMeta"),

        form: document.getElementById("asistenciaForm"),
        inputNombre: document.getElementById("inputNombre"),
        inputFecha: document.getElementById("inputFecha"),
        datePickerHelper: document.getElementById("datePickerHelper"),
        btnFechaHoy: document.getElementById("btnFechaHoy"),
        inputTipo: document.getElementById("inputTipo"),
        inputEstado: document.getElementById("inputEstado"),
        btnSubmit: document.getElementById("btnSubmit"),
        btnResetForm: document.getElementById("btnResetForm"),

        inputSearch: document.getElementById("inputSearch"),
        selectPageSize: document.getElementById("selectPageSize"),
        tableBody: document.getElementById("tableBody"),
        paginationInfo: document.getElementById("paginationInfo"),
        pageNumbers: document.getElementById("pageNumbers"),
        btnPrevPage: document.getElementById("btnPrevPage"),
        btnNextPage: document.getElementById("btnNextPage")
    };

    // Utilidades de formato
    function getTodayNumeric() {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, "0");
        const dd = String(now.getDate()).padStart(2, "0");
        return {
            numeric: `${yyyy}${mm}${dd}`,
            iso: `${yyyy}-${mm}-${dd}`
        };
    }

    function formatFechaDisplay(val) {
        if (val === null || val === undefined || Number.isNaN(Number(val))) {
            return { main: "—", raw: "" };
        }
        const num = Number(val);
        const intStr = Number.isInteger(num) ? String(num) : String(num);
        if (/^\d{8}$/.test(intStr)) {
            const formatted = `${intStr.slice(0, 4)}-${intStr.slice(4, 6)}-${intStr.slice(6, 8)}`;
            return { main: formatted, raw: `Valor: ${intStr}` };
        }
        return { main: String(num), raw: "Numérico" };
    }

    function formatTipoEntrenamiento(val) {
        const num = Number(val);
        const labels = {
            1: "1 · Fuerza",
            2: "2 · Cardio",
            3: "3 · Funcional"
        };
        return labels[num] || `Código ${num}`;
    }

    function formatEstado(val) {
        const num = Number(val);
        if (num === 1) return { label: "1 · Presente", cls: "badge-green" };
        if (num === 0) return { label: "0 · Ausente", cls: "badge-red" };
        if (num === 2) return { label: "2 · Tardanza", cls: "badge-amber" };
        return { label: `Estado ${num}`, cls: "badge-neutral" };
    }

    function escapeHtml(text) {
        const div = document.createElement("div");
        div.textContent = text ?? "";
        return div.innerHTML;
    }

    // UI Helpers
    function setConnectionStatus(status, label) {
        el.apiStatusBadge.className = `status-pill status-${status}`;
        el.apiStatusText.textContent = label;
    }

    function updateHttpStat(statusCode, endpointLabel) {
        el.statHttpStatus.textContent = statusCode ? `HTTP ${statusCode}` : "Error";
        el.statEndpointMeta.textContent = endpointLabel;
    }

    function showAlert(type, title, message, details = "") {
        el.alertContainer.className = `alert alert-${type}`;
        el.alertTitle.textContent = title;
        el.alertMessage.textContent = message;
        if (details) {
            el.alertDetails.textContent = details;
            el.alertDetails.classList.remove("hidden");
        } else {
            el.alertDetails.textContent = "";
            el.alertDetails.classList.add("hidden");
        }
    }

    function hideAlert() {
        el.alertContainer.classList.add("hidden");
    }

    // Renderizado de tabla
    function renderTable() {
        const query = el.inputSearch.value.trim().toLowerCase();
        const filtered = query
            ? state.records.filter(item =>
                String(item.id).includes(query) ||
                (item.nombre && item.nombre.toLowerCase().includes(query)) ||
                String(item.fecha).includes(query)
            )
            : state.records;

        if (state.loading) {
            el.tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="table-placeholder">Cargando registros desde MySQL...</td>
                </tr>`;
            return;
        }

        if (filtered.length === 0) {
            const msg = query
                ? "No se encontraron coincidencias en la página actual para tu búsqueda."
                : "No hay registros de asistencia en esta página. ¡Crea el primero desde el formulario!";
            el.tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="table-placeholder">${escapeHtml(msg)}</td>
                </tr>`;
            return;
        }

        el.tableBody.innerHTML = filtered.map(item => {
            const fecha = formatFechaDisplay(item.fecha);
            const tipo = formatTipoEntrenamiento(item.tipoEntrenamiento);
            const estado = formatEstado(item.estado);

            return `
                <tr>
                    <td class="id-cell">#${escapeHtml(String(item.id))}</td>
                    <td class="name-cell">${escapeHtml(item.nombre)}</td>
                    <td>
                        ${escapeHtml(fecha.main)}
                        <span class="sub-val">${escapeHtml(fecha.raw)}</span>
                    </td>
                    <td><span class="badge badge-blue">${escapeHtml(tipo)}</span></td>
                    <td><span class="badge ${estado.cls}">${escapeHtml(estado.label)}</span></td>
                </tr>`;
        }).join("");
    }

    // Renderizado de estadísticas y paginación
    function renderPaginationAndStats() {
        const totalPagesDisplay = Math.max(state.totalPages, 1);
        el.statTotalItems.textContent = String(state.totalItems);
        el.statCurrentPage.textContent = `${state.page + 1} / ${totalPagesDisplay}`;
        el.statPageIndex.textContent = `Índice API: page=${state.page}`;
        el.statPageCount.textContent = String(state.records.length);
        el.statPageSizeMeta.textContent = `Tamaño máximo: ${state.size}`;

        if (state.totalItems === 0) {
            el.paginationInfo.textContent = "Mostrando 0 de 0 registros";
        } else {
            const start = state.page * state.size + 1;
            const end = start + state.records.length - 1;
            el.paginationInfo.textContent = `Mostrando ${start}–${end} de ${state.totalItems} registros`;
        }

        el.btnPrevPage.disabled = state.loading || state.page <= 0;
        el.btnNextPage.disabled = state.loading || state.page + 1 >= state.totalPages;

        // Botones numéricos de página
        el.pageNumbers.innerHTML = "";
        const maxButtons = 5;
        let startPage = Math.max(0, state.page - Math.floor(maxButtons / 2));
        let endPage = Math.min(totalPagesDisplay - 1, startPage + maxButtons - 1);
        if (endPage - startPage + 1 < maxButtons) {
            startPage = Math.max(0, endPage - maxButtons + 1);
        }

        for (let p = startPage; p <= endPage; p++) {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = `page-btn ${p === state.page ? "active" : ""}`;
            btn.textContent = String(p + 1);
            btn.disabled = state.loading || (state.totalPages === 0 && p > 0);
            btn.addEventListener("click", () => {
                if (p !== state.page) {
                    loadAsistencias(p, state.size);
                }
            });
            el.pageNumbers.appendChild(btn);
        }
    }

    // Llamada GET /api/asistencia?page=...&size=...
    async function loadAsistencias(page = state.page, size = state.size) {
        state.loading = true;
        renderTable();
        renderPaginationAndStats();
        setConnectionStatus("loading", "Consultando...");

        const url = `${API_BASE_URL}?page=${encodeURIComponent(page)}&size=${encodeURIComponent(size)}`;

        try {
            const response = await fetch(url, {
                method: "GET",
                headers: { "Accept": "application/json" }
            });

            const payload = await response.json().catch(() => ({}));
            updateHttpStat(response.status, `GET ?page=${page}&size=${size}`);

            if (!response.ok) {
                setConnectionStatus("offline", `Error ${response.status}`);
                const type = response.status === 400 ? "warning" : "danger";
                showAlert(
                    type,
                    `Error ${response.status} (${payload.error || "Solicitud fallida"})`,
                    payload.message || "No se pudieron obtener los registros de asistencia.",
                    payload.details || ""
                );
                state.records = [];
                return;
            }

            state.page = payload.currentPage ?? page;
            state.size = payload.pageSize ?? size;
            state.totalItems = payload.totalItems ?? 0;
            state.totalPages = payload.totalPages ?? 0;
            state.records = Array.isArray(payload.data) ? payload.data : [];

            setConnectionStatus("online", "API Conectada");
        } catch (err) {
            setConnectionStatus("offline", "Sin conexión");
            updateHttpStat(null, "Error de red (GET)");
            showAlert(
                "danger",
                "No se pudo conectar con la API",
                "Verifica que el servidor Spring Boot esté ejecutándose en el puerto 8080 y MySQL en el puerto 3306.",
                err.message
            );
            state.records = [];
        } finally {
            state.loading = false;
            renderTable();
            renderPaginationAndStats();
        }
    }

    // Llamada POST /api/asistencia
    async function handleCreateSubmit(event) {
        event.preventDefault();
        hideAlert();

        const nombre = el.inputNombre.value.trim();
        const fecha = Number(el.inputFecha.value);
        const tipoEntrenamiento = Number(el.inputTipo.value);
        const estado = Number(el.inputEstado.value);

        const body = {
            id: 0,
            nombre,
            fecha: Number.isNaN(fecha) ? 0 : fecha,
            tipoEntrenamiento: Number.isNaN(tipoEntrenamiento) ? 0 : tipoEntrenamiento,
            estado: Number.isNaN(estado) ? 0 : estado
        };

        el.btnSubmit.disabled = true;
        el.btnSubmit.querySelector(".btn-text").textContent = "Guardando...";

        try {
            const response = await fetch(API_BASE_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify(body)
            });

            const payload = await response.json().catch(() => ({}));
            updateHttpStat(response.status, "POST /api/asistencia");

            if (!response.ok) {
                const type = response.status === 400 ? "warning" : "danger";
                showAlert(
                    type,
                    `Error ${response.status} (${payload.error || "Error al registrar"})`,
                    payload.message || "No se pudo guardar el registro.",
                    payload.details || ""
                );
                return;
            }

            const created = payload.data || body;
            showAlert(
                "success",
                `Registro guardado (HTTP ${response.status})`,
                `${payload.message || "Asistencia registrada correctamente"} — ID #${created.id ?? ""} (${created.nombre}).`
            );

            el.inputNombre.value = "";
            el.inputNombre.focus();

            // Recargar tabla para reflejar el nuevo registro
            await loadAsistencias(state.page, state.size);
        } catch (err) {
            setConnectionStatus("offline", "Sin conexión");
            updateHttpStat(null, "Error de red (POST)");
            showAlert(
                "danger",
                "Error de conexión al enviar POST",
                "No fue posible comunicarse con el servidor Spring Boot.",
                err.message
            );
        } finally {
            el.btnSubmit.disabled = false;
            el.btnSubmit.querySelector(".btn-text").textContent = "Registrar Asistencia";
        }
    }

    // Inicialización de eventos
    function init() {
        el.apiUrlDisplay.textContent = API_BASE_URL;

        // Fecha por defecto (hoy)
        const today = getTodayNumeric();
        el.inputFecha.value = today.numeric;
        el.datePickerHelper.value = today.iso;

        el.btnFechaHoy.addEventListener("click", () => {
            const current = getTodayNumeric();
            el.inputFecha.value = current.numeric;
            el.datePickerHelper.value = current.iso;
        });

        el.datePickerHelper.addEventListener("change", () => {
            if (el.datePickerHelper.value) {
                el.inputFecha.value = el.datePickerHelper.value.replaceAll("-", "");
            }
        });

        // Chips rápidos para tipoEntrenamiento y estado
        document.querySelectorAll(".quick-chips").forEach(group => {
            const targetInput = document.getElementById(group.dataset.target);
            group.querySelectorAll(".chip").forEach(chip => {
                chip.addEventListener("click", () => {
                    if (targetInput) {
                        targetInput.value = chip.dataset.value;
                    }
                });
            });
        });

        el.form.addEventListener("submit", handleCreateSubmit);

        el.btnResetForm.addEventListener("click", () => {
            el.form.reset();
            const current = getTodayNumeric();
            el.inputFecha.value = current.numeric;
            el.datePickerHelper.value = current.iso;
            el.inputTipo.value = "1";
            el.inputEstado.value = "1";
            hideAlert();
        });

        el.btnRefreshTop.addEventListener("click", () => {
            hideAlert();
            loadAsistencias(state.page, state.size);
        });

        el.btnCloseAlert.addEventListener("click", hideAlert);

        el.inputSearch.addEventListener("input", renderTable);

        el.selectPageSize.addEventListener("change", () => {
            const newSize = Number(el.selectPageSize.value) || 10;
            loadAsistencias(0, newSize);
        });

        el.btnPrevPage.addEventListener("click", () => {
            if (state.page > 0) {
                loadAsistencias(state.page - 1, state.size);
            }
        });

        el.btnNextPage.addEventListener("click", () => {
            if (state.page + 1 < state.totalPages) {
                loadAsistencias(state.page + 1, state.size);
            }
        });

        // Carga inicial
        loadAsistencias(0, state.size);
    }

    document.addEventListener("DOMContentLoaded", init);
})();

