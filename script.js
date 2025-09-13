document.addEventListener('DOMContentLoaded', () => {
     const panels       = document.querySelectorAll('.glass');
    const notesWidget  = document.getElementById('widget-notes');
    const notesDisplay = document.getElementById('notes-display');
    const notesTextarea= document.getElementById('notes-textarea');
    const notesKey     = 'dashboard_notes';

     function renderNotes(text){
      const escaped = text.replace(/[&<>"']/g,
        s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
      notesDisplay.innerHTML = escaped.replace(/\n/g,'<br>');
    }

    const savedNotes = localStorage.getItem(notesKey);
    if (savedNotes) {
      renderNotes(savedNotes);
      notesTextarea.value = savedNotes;
    }

    if (notesWidget && notesDisplay && notesTextarea){
      notesWidget.addEventListener('click', e => {
        if (activePanel) return;               // не редактируем во время drag
        notesDisplay.style.display  = 'none';
        notesTextarea.style.display = 'block';
        notesTextarea.focus();
      });

      notesTextarea.addEventListener('blur', () => {
        const txt = notesTextarea.value;
        localStorage.setItem(notesKey, txt);
        renderNotes(txt);
        notesDisplay.style.display  = 'block';
        notesTextarea.style.display = 'none';
      });
    }

     async function updateWeather(){
      const widget = document.getElementById('widget-weather');
      if (!widget) return;
      const h3 = widget.querySelector('h3');
      const p  = widget.querySelector('p');
      try{
        const lat=53.9, lon=27.57;
        const url=`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`;
        const r = await fetch(url);
        if(!r.ok) throw new Error();
        const d = await r.json();
        const t = Math.round(d.current.temperature_2m);
        const c = d.current.weather_code;

        const map = {
          0:{desc:"Ясно",icon:"☀️"},1:{desc:"Малооблачно",icon:"🌤️"},
          2:{desc:"Облачно",icon:"☁️"},3:{desc:"Пасмурно",icon:"🌥️"},
          45:{desc:"Туман",icon:"🌫️"},48:{desc:"Изморозь",icon:"🌫️"},
          51:{desc:"Морось",icon:"🌦️"},61:{desc:"Дождь",icon:"🌧️"},
          71:{desc:"Снег",icon:"🌨️"},80:{desc:"Ливень",icon:"💧"},
          95:{desc:"Гроза",icon:"⛈️"}
        };
        const {desc,icon}=map[c]||{desc:"Неизвестно",icon:"🤷"};
        h3.textContent = `Погода ${icon}`;
        p.textContent  = `Минск: ${t}°C, ${desc}`;
      }catch(e){
        if (p) p.textContent='Ошибка загрузки.';
      }
    }

     let activePanel=null, offsetX=0, offsetY=0;

    function loadPosition(id){
      try {
        const s = localStorage.getItem('panel_pos_'+id);
        return s ? JSON.parse(s) : null;
      } catch { return null; }
    }

    panels.forEach((panel,i)=>{
      const pos = loadPosition(panel.id);
      if (pos) {
        panel.style.left = pos.x + 'px';
        panel.style.top  = pos.y + 'px';
      } else if (window.innerWidth <= 768) {
        panel.style.left = '20px';
        panel.style.top  = (i*200 + 20) + 'px';
      }
    });

    function onPointerDown(e){
      const p = e.target.closest('.glass');
      if (!p || e.target === notesTextarea) return;
      activePanel = p;
      activePanel.setPointerCapture(e.pointerId);
      const rect = activePanel.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      activePanel.style.zIndex = 100;
      activePanel.style.cursor = 'grabbing';
    }

    function onPointerMove(e){
      if (!activePanel) return;
      e.preventDefault();
      const parent = activePanel.parentElement.getBoundingClientRect();
      let x = e.clientX - offsetX - parent.left;
      let y = e.clientY - offsetY - parent.top;
      x = Math.max(0, Math.min(x, parent.width  - activePanel.offsetWidth));
      y = Math.max(0, Math.min(y, parent.height - activePanel.offsetHeight));
      activePanel.style.left = x + 'px';
      activePanel.style.top  = y + 'px';
    }

    function onPointerUp(e){
      if (!activePanel) return;
      try { activePanel.releasePointerCapture(e.pointerId); } catch{}
      activePanel.style.cursor = 'grab';
      activePanel.style.zIndex = '';
      localStorage.setItem(
        'panel_pos_'+activePanel.id,
        JSON.stringify({x:activePanel.offsetLeft, y:activePanel.offsetTop})
      );
      activePanel = null;
    }

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup',   onPointerUp);
    document.addEventListener('pointercancel', onPointerUp);

     updateWeather();
  });
