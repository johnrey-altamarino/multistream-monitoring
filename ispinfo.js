    async function fetchISPInfo() {
        try {
            const response = await fetch('https://ipinfo.io/json?token=89518cd2bfc944');
            const data = await response.json();
            document.getElementById('ispInfo').innerText = `Your ISP: ${data.org}`;
        } catch (error) {
            document.getElementById('ispInfo').innerText = 'Unable to retrieve ISP information';
        }
    }

    fetchISPInfo();