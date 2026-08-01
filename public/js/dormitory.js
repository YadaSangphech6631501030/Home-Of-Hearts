(() => {
    const floorFilter = document.getElementById("floor-filter");
    const statusFilter = document.getElementById("status-filter");
    const searchInput = document.getElementById("room-search");
    const floorList = document.getElementById("floor-list");

    let rooms = [];

    const roomPosition = {
        "101":"r3c1", "102":"r3c2", "103":"r3c5", "104":"r3c6",
        "105":"r1c1", "106":"r1c2", "107":"r1c3", "108":"r1c4", "109":"r1c5", "110":"r1c6",

        "201":"r3c1", "202":"r3c2", "203":"r3c5", "204":"r3c6",
        "205":"r1c1", "206":"r1c2", "207":"r1c3", "208":"r1c4", "209":"r1c5", "210":"r1c6",

        "301":"r3c1", "302":"r3c2", "303":"r3c5", "304":"r3c6",
        "305":"r1c1", "306":"r1c2", "307":"r1c3", "308":"r1c4", "309":"r1c5", "310":"r1c6"
    };

    //  status
    function statusText(status) {
        switch(status) {
            case "available":
                return "ว่าง";
            case "occupied":
                return "ไม่ว่าง";
            case "maintenance":
                return "ซ่อม";
            default:
                return status;
        }
    }

    // create room card
    function createRoom(room) {
        const card = document.createElement("article");
        card.className = `room-card ${room.status} ${roomPosition[room.roomNumber] || ''}`;

        card.innerHTML = `
            <h3>${room.roomNumber}</h3>
            <p>
                ${statusText(room.status)}
                <span class="room-dot room-dot--${room.status}"></span>
            </p>
            <a class="room-detail-link" href="/admin/room-detail.html?roomNumber=${room.roomNumber}">
                ดูรายละเอียด
            </a>
        `;

        return card;
    }

   // render rooms
    function renderRooms() {
        floorList.innerHTML = "";

        let filtered = [...rooms];

        if (floorFilter.value) {
            filtered = filtered.filter(room => String(room.floor) === floorFilter.value);
        }

        if (statusFilter.value) {
            filtered = filtered.filter(room => room.status === statusFilter.value);
        }

        if (searchInput.value.trim()) {
            filtered = filtered.filter(room =>
                room.roomNumber.includes(searchInput.value.trim())
            );
        }

        const group = {};

        filtered.forEach(room => {
            if (!group[room.floor]) {
                group[room.floor] = [];
            }
            group[room.floor].push(room);
        });

        Object.keys(group)
        .sort((a, b) => a - b)
        .forEach(floor => {
            const section = document.createElement("section");
            section.className = "floor-section";
            section.innerHTML = `
                <h2>ชั้น ${floor}</h2>
                <div class="floor-layout"></div>
            `;

            const layout = section.querySelector(".floor-layout");

            const hallway = document.createElement("div");
            hallway.className = "hallway";
            hallway.textContent = "ทางเดิน";
            layout.appendChild(hallway);

            const stairs = document.createElement("div");
            stairs.className = "stairs";
            stairs.textContent = "บันได";
            layout.appendChild(stairs);

            group[floor]
            .sort((a, b) => a.roomNumber.localeCompare(b.roomNumber))
            .forEach(room => {
                layout.appendChild(createRoom(room));
            });

            floorList.appendChild(section);
        });

        if (filtered.length === 0) {
            floorList.innerHTML = `
                <div class="floor-section">
                    <h2>ไม่พบข้อมูลห้องพัก</h2>
                </div>
            `;
        }
    }
    
    async function loadRooms() {
        try {
            const data = await API.get("/api/rooms");
            rooms = data.rooms || data || [];

            const floors = [...new Set(rooms.map(room => room.floor))].sort((a, b) => a - b);

            floorFilter.innerHTML = `<option value="">ชั้น</option>`;

            floors.forEach(floor => {
                const option = document.createElement("option");
                option.value = floor;
                option.textContent = `ชั้น ${floor}`;
                floorFilter.appendChild(option);
            });

            renderRooms();
        } catch (err) {
            console.error(err);
            floorList.innerHTML = `
                <div class="floor-section">
                    <h2>โหลดข้อมูลไม่สำเร็จ</h2>
                </div>
            `;
        }
    }

    // Event Listeners
    floorFilter.addEventListener("change", renderRooms);
    statusFilter.addEventListener("change", renderRooms);
    searchInput.addEventListener("input", renderRooms);

    loadRooms();
})();