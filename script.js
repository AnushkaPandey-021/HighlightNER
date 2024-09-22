document.addEventListener("DOMContentLoaded", function() {
    const chatInput = document.getElementById("chat-input");
    const sendBtn = document.getElementById("send-btn");
    const chatOutput = document.getElementById("chat-output");
    const entityFilter = document.getElementById("entity-filter");
    const downloadBtn = document.getElementById("download-btn");
    const ctx = document.getElementById('entity-chart').getContext('2d');
    let chart; // Store chart instance
    let recognizedEntities = []; // Store recognized entities

    sendBtn.addEventListener("click", function() {
        const text = chatInput.value.trim();
        if (text !== "") {
            fetch("/ner", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: `text=${text}`
            })
            .then(response => response.json())
            .then(data => {
                recognizedEntities = data; // Store entities for downloading
    
                if (data.length === 0) {
                    chatOutput.innerHTML = "No entities found.";
                    if (chart) chart.destroy(); // Clear the chart if no data
                } else {
                    // Convert both the entity label and dropdown value to uppercase to ensure case-insensitive comparison
                    const filteredEntities = entityFilter.value === "all" 
                        ? data 
                        : data.filter(entity => entity.label.toUpperCase() === entityFilter.value.toUpperCase());
    
                    const outputHtml = filteredEntities.map(entity => {
                        return `<span class="entity ${entity.label}">${entity.text}: <span class="entity-label">${getLabelName(entity.label)}</span></span>`;
                    }).join(" ");
    
                    chatOutput.innerHTML = outputHtml;
    
                    // Update chart
                    updateChart(data);
                    downloadBtn.style.display = 'block'; // Show download button
                }
            })
            .catch(error => console.error(error));
            chatInput.value = "";
        }
    });
    

    function updateChart(entities) {
        const counts = {};
        entities.forEach(entity => {
            counts[entity.label] = (counts[entity.label] || 0) + 1;
        });

        const labels = Object.keys(counts);
        const data = Object.values(counts);

        if (chart) chart.destroy(); // Destroy previous chart if it exists

        chart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Entity Distribution',
                    data: data,
                    backgroundColor: labels.map(label => getColorForLabel(label)),
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                }
            }
        });
    }

    function getColorForLabel(label) {
        // Return colors based on entity type
        switch (label) {
            case "ORG": return "#FFC0CB";
            case "GPE": return "#ADD8E6";
            case "LOC": return "#90EE90";
            case "PERSON": return "#FFD700";
            case "DATE": return "#FFFACD";
            case "MONEY": return "#90EE90";
            case "PERCENT": return "#E0FFFF";
            case "MISC": return "#F0E68C";
            case "PRODUCT": return "#DDA0DD";
            case "EVENT": return "#FFDEAD";
            case "WORK_OF_ART": return "#B0E0E6";
            case "LAW": return "#FFE4E1";
            case "LANGUAGE": return "#F5F5DC";
            case "NORP": return "#FFA07A"; // Nationalities
            default: return "#D3D3D3"; // Gray for unknown
        }
    }

    downloadBtn.addEventListener("click", function() {
        fetch("/download", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ entities: recognizedEntities })  // Send recognized entities
        })
        .then(response => response.blob())
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'entities.csv';
            document.body.appendChild(a);
            a.click();
            a.remove();
        })
        .catch(error => console.error('Error downloading CSV:', error));
    });
    
    
    

    function getLabelName(label) {
        switch (label) {
            case "ORG": return "Organization";
            case "GPE": return "Geopolitical Entity";
            case "LOC": return "Location";
            case "PERSON": return "Person";
            case "DATE": return "Date";
            case "MONEY": return "Money";
            case "PERCENT": return "Percentage";
            case "MISC": return "Miscellaneous";
            case "PRODUCT": return "Product";
            case "EVENT": return "Event";
            case "WORK_OF_ART": return "Work of Art";
            case "LAW": return "Law";
            case "LANGUAGE": return "Language";
            case "NORP": return "Nationality or Religious or Political Group";
            default: return "Unknown";
        }
    }
});
