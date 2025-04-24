    const taskList = document.getElementById('taskList');
    const taskInput = document.getElementById('taskInput');

    // --- Drag and Drop State ---
    let draggedItem = null; // The <li> element being dragged
    let placeholder = null; // The placeholder <li> element

    function saveTasks() {
      const tasks = [];
      taskList.querySelectorAll('li:not(.placeholder)').forEach(li => {
        const textEl = li.querySelector('.task-text');
        const checkEl = li.querySelector('.check');
        if (textEl && checkEl) {
            tasks.push({
              text: textEl.textContent,
              checked: checkEl.classList.contains('checked')
            });
        } else {
            console.warn("Skipping malformed li during save:", li);
        }
      });
      localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function loadTasks() {
      const data = localStorage.getItem('tasks');
      if (!data) return;
      try {
        const tasks = JSON.parse(data);
        taskList.innerHTML = '';
        tasks.forEach(task => {
          const li = createTaskElement(task.text, task.checked);
          taskList.appendChild(li);
        });
      } catch (e) {
        console.error("Failed to load tasks from storage", e);
        localStorage.removeItem('tasks');
      }
    }

    function createTaskElement(text, checked = false) {
      const li = document.createElement('li');
      li.setAttribute('draggable', 'true');
      li.innerHTML = `
        <div class="check${checked ? ' checked' : ''}" onclick="toggleCheck(this)"></div>
        <div class="task-text">${text}</div>
        <div class="icons">
          <div class="delete" onclick="deleteTask(this)">×</div>
          <div class="handle">≡</div>
        </div>
      `;
      addDragDropListeners(li);
      return li;
    }

    function addTask() {
      const text = taskInput.value.trim();
      if (!text) return;
      const li = createTaskElement(text);
      taskList.appendChild(li);
      taskInput.value = '';
      saveTasks();
    }

    function toggleCheck(el) {
      el.classList.toggle('checked');
      saveTasks();
    }

    function deleteTask(el) {
      const listItem = el.closest('li');
      if (listItem) {
          listItem.remove();
          saveTasks();
      }
    }

    function resetChecks() {
      taskList.querySelectorAll('.check').forEach(el => el.classList.remove('checked'));
      saveTasks();
    }

    // --- New Drag and Drop Implementation ---

    function createPlaceholder(height) {
        const ph = document.createElement('li');
        ph.className = 'placeholder';
        ph.style.height = `${height}px`;
        return ph;
    }

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('li:not(.placeholder):not(.hidden-original)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    function addDragDropListeners(item) {
        const handle = item.querySelector('.handle');

        // --- Mouse Drag Events (on the LI) ---
        item.addEventListener('dragstart', (e) => {
            draggedItem = item;
            const height = draggedItem.offsetHeight;
            placeholder = createPlaceholder(height);

            e.dataTransfer.effectAllowed = 'move';
            try {
                const canvas = document.createElement('canvas');
                canvas.width = 1; canvas.height = 1;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.fillStyle = 'rgba(0,0,0,0)';
                    ctx.fillRect(0,0,1,1);
                }
                e.dataTransfer.setDragImage(canvas, 0, 0);
            } catch (err) { console.warn("Could not set custom drag image", err); }

            setTimeout(() => {
                if (draggedItem) {
                    draggedItem.classList.add('hidden-original');
                    taskList.insertBefore(placeholder, draggedItem);
                }
            }, 0);

            document.body.classList.add('dragging-active');
        });

        item.addEventListener('dragend', (e) => {
            if (!draggedItem) return;

            if (placeholder && placeholder.parentNode) {
                placeholder.replaceWith(draggedItem);
            } else if (placeholder) {
                placeholder.remove();
            }

            draggedItem.classList.remove('hidden-original');
            draggedItem = null;
            placeholder = null;

            document.body.classList.remove('dragging-active');
            saveTasks();
        });

        // --- Touch Events (on the Handle) ---
        if (handle) {
            handle.addEventListener('touchstart', (e) => {
                if (draggedItem) return;

                draggedItem = item;
                const height = draggedItem.offsetHeight;
                placeholder = createPlaceholder(height);

                taskList.insertBefore(placeholder, draggedItem);
                draggedItem.classList.add('hidden-original');
                document.body.classList.add('dragging-active');

                document.addEventListener('touchmove', handleTouchMove, { passive: false });
                document.addEventListener('touchend', handleTouchEnd);
                document.addEventListener('touchcancel', handleTouchEnd);

            }, { passive: true });
        }
    }

    // --- Global Drag/Touch Handlers ---

    taskList.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (!placeholder || !draggedItem) return;

        const afterElement = getDragAfterElement(taskList, e.clientY);
        if (afterElement === null) {
            taskList.appendChild(placeholder);
        } else {
            taskList.insertBefore(placeholder, afterElement);
        }
    });

    function handleTouchMove(e) {
        if (!draggedItem || !placeholder) return;
        e.preventDefault(); // Prevent scroll while dragging

        const touch = e.touches[0];
        const afterElement = getDragAfterElement(taskList, touch.clientY);

        if (afterElement === null) {
            taskList.appendChild(placeholder);
        } else {
             // Check if the element to insert before is not the placeholder itself
            if (placeholder !== afterElement) {
                 taskList.insertBefore(placeholder, afterElement);
            }
        }
    }

    function handleTouchEnd(e) {
        if (!draggedItem) return;

        if (placeholder && placeholder.parentNode) {
            placeholder.replaceWith(draggedItem);
        } else if (placeholder) {
            placeholder.remove();
        }

        draggedItem.classList.remove('hidden-original');
        draggedItem = null;
        placeholder = null;

        document.body.classList.remove('dragging-active');
        document.removeEventListener('touchmove', handleTouchMove, { passive: false });
        document.removeEventListener('touchend', handleTouchEnd);
        document.removeEventListener('touchcancel', handleTouchEnd);

        saveTasks();
    }

    // --- Initialization ---
    window.onload = () => {
      loadTasks();

      const urlParams = new URLSearchParams(window.location.search);
      const fromParam = urlParams.get('from');
      if (fromParam) {
        try {
            const fromTime = new Date(fromParam);
            if (!isNaN(fromTime)) {
              const now = new Date();
              const diff = now.getTime() - fromTime.getTime();
              const resetThreshold = 2 * 60 * 60 * 1000;
              if (diff >= resetThreshold) {
                console.log("Resetting checks due to time passed.");
                resetChecks();
              }
            }
        } catch (e) { console.error("Error processing 'from' parameter:", e); }
      }

      taskInput.addEventListener('keypress', function(event) {
          if (event.key === 'Enter') {
              event.preventDefault();
              addTask();
          }
      });
    };