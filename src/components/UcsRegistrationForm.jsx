// UcsRegistrationForm.jsx
import React, { useEffect, useState } from 'react';
import { BookOpen, Clock, GraduationCap } from 'lucide-react';

const UcsRegistrationForm = ({ cursos = [], onSubmit, initialData = null, onCancel = null }) => {
  const [formData, setFormData] = useState({
    nomeuc: initialData?.nomeuc || '',
    cargahoraria: initialData?.cargahoraria?.toString() || '',
    // agora guardamos o nome do curso visível e também o id (idcurso pode vir do initialData)
    courseName: initialData?.cursos?.nomecurso || '',
    idcurso: initialData?.idcurso?.toString() || ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState({ type: '', text: '' });
  const [showOptions, setShowOptions] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.form-group')) {
        setShowOptions(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({
        nomeuc: initialData.nomeuc || '',
        cargahoraria: initialData.cargahoraria?.toString() || '',
        courseName: initialData?.cursos?.nomecurso || '',
        idcurso: initialData?.idcurso?.toString() || ''
      });
    } else {
      // Quando não está editando, mantemos o campo de curso vazio
      setFormData(prev => ({ ...prev, idcurso: '', courseName: '' }));
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // se o usuário digitar no campo de courseName, limpamos o idcurso
    if (name === 'courseName') {
      setFormData(prev => ({
        ...prev,
        courseName: value,
        idcurso: '' // será resolvido na validação/submit
      }));
      if (errors.courseName) {
        setErrors(prev => ({ ...prev, courseName: '' }));
      }
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nomeuc.trim()) {
      newErrors.nomeuc = 'Nome da UC é obrigatório';
    } else if (formData.nomeuc.trim().length < 3) {
      newErrors.nomeuc = 'Nome da UC deve ter pelo menos 3 caracteres';
    }

    if (!formData.cargahoraria) {
      newErrors.cargahoraria = 'Carga horária é obrigatória';
    } else {
      const cargaHorariaNum = parseInt(formData.cargahoraria);
      if (isNaN(cargaHorariaNum) || cargaHorariaNum < 1 || cargaHorariaNum > 2000) {
        newErrors.cargahoraria = 'Carga horária deve estar entre 1 e 2000 horas';
      }
    }

    // validar courseName e resolver para idcurso
    if (!formData.courseName || !formData.courseName.trim()) {
      newErrors.courseName = 'Curso é obrigatório';
    } else {
      // procurar curso pelo nome exato (case-insensitive)
      const match = cursos.find(c =>
        String(c.nomecurso).toLowerCase() === String(formData.courseName).toLowerCase()
      );
      if (!match) {
        newErrors.courseName = 'Curso não encontrado. Selecione um curso da lista.';
      } else {
        // preencher idcurso com o id do match (string)
        setFormData(prev => ({ ...prev, idcurso: String(match.idcurso) }));
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // validação (vai também resolver idcurso)
    if (!validateForm()) {
      setSubmitMessage({
        type: 'error',
        text: 'Por favor, corrija os erros antes de continuar.'
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage({ type: '', text: '' });

    try {
      // Encontrar o idcurso final (já tentamos resolver na validação, mas reforçamos)
      const matchedCurso = cursos.find(c =>
        String(c.nomecurso).toLowerCase() === String(formData.courseName).toLowerCase()
      );
      if (!matchedCurso) {
        throw new Error('Curso selecionado inválido');
      }

      const dataToSubmit = {
        nomeuc: formData.nomeuc,
        cargahoraria: parseInt(formData.cargahoraria),
        idcurso: parseInt(matchedCurso.idcurso)
      };

      await onSubmit(dataToSubmit);

      setSubmitMessage({
        type: 'success',
        text: initialData ? 'Unidade Curricular atualizada com sucesso!' : 'Unidade Curricular registrada com sucesso!'
      });

      if (!initialData) {
        clearForm();
      }
    } catch (error) {
      setSubmitMessage({
        type: 'error',
        text: `Erro ao ${initialData ? 'atualizar' : 'registrar'} UC: ${error.message}`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearForm = () => {
    setFormData({
      nomeuc: '',
      cargahoraria: '',
      courseName: '',
      idcurso: ''
    });
    setErrors({});
  };

  return (
    <div>
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="nomeuc" className="form-label">
            <BookOpen size={16} />
            Nome
          </label>
          <input
            type="text"
            className={`form-input ${errors.nomeuc ? 'error' : ''}`}
            id="nomeuc"
            name="nomeuc"
            value={formData.nomeuc}
            onChange={handleChange}
            placeholder="Nome da UC"
          />
          {errors.nomeuc && (
            <div className="error-message">{errors.nomeuc}</div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="cargahoraria" className="form-label">
            <Clock size={16} />
            Carga Horária
          </label>
          <input
            type="number"
            className={`form-input ${errors.cargahoraria ? 'error' : ''}`}
            id="cargahoraria"
            name="cargahoraria"
            value={formData.cargahoraria}
            onChange={handleChange}
            min="1"
            max="500"
            placeholder="Carga Horária em horas"
          />
          {errors.cargahoraria && (
            <div className="error-message">{errors.cargahoraria}</div>
          )}
        </div>

        {/* Campo de Curso: híbrido (select + busca) */}
        <div className="form-group" style={{ position: 'relative' }}>
          <label htmlFor="courseName" className="form-label">
            <GraduationCap size={16} />
            Curso
          </label>

          <div style={{ position: 'relative' }}>
            <input
              type="text"
              id="courseName"
              name="courseName"
              className={`form-input ${errors.courseName ? 'error' : ''}`}
              placeholder="Digite ou selecione um curso"
              value={formData.courseName}
              onChange={(e) => {
                handleChange(e);
                setShowOptions(true);
              }}
              onFocus={() => setShowOptions(true)}
              autoComplete="off"
              style={{ paddingRight: '30px' }}
            />
            {/* “Flechinha” visual */}
            <div
              onClick={() => setShowOptions(!showOptions)}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#555'
              }}
            >
              ▼
            </div>

            {/* Lista suspensa filtrada */}
            {showOptions && (
              <ul
                style={{
                  position: 'absolute',
                  zIndex: 10,
                  background: '#fff',
                  border: '1px solid #ccc',
                  width: '100%',
                  maxHeight: '180px',
                  overflowY: 'auto',
                  borderRadius: '6px',
                  marginTop: '4px',
                  listStyle: 'none',
                  padding: 0,
                }}
              >
                {cursos
                  .filter(c =>
                    c.nomecurso
                      .toLowerCase()
                      .startsWith(formData.courseName.toLowerCase())
                  )
                  .map((curso) => (
                    <li
                      key={curso.idcurso}
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          courseName: curso.nomecurso,
                          idcurso: curso.idcurso.toString()
                        }));
                        setShowOptions(false);
                      }}
                      style={{
                        padding: '6px 10px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #eee',
                        background:
                          curso.nomecurso === formData.courseName ? '#f0f0f0' : 'white',
                      }}
                      onMouseDown={(e) => e.preventDefault()} // evita perder foco ao clicar
                    >
                      {curso.nomecurso}
                    </li>
                  ))}
              </ul>
            )}
          </div>

          {errors.courseName && (
            <div className="error-message">{errors.courseName}</div>
          )}
        </div>


        <div className="form-actions">
          {onCancel && (
            <button
              type="button"
              className="btn-secondary"
              onClick={onCancel}
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            className="btn-save"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Salvando...' : `💾 ${initialData ? 'Atualizar' : 'Salvar'} Unidade Curricular`}
          </button>
        </div>
      </form>

      {submitMessage.text && (
        <div className={`message ${submitMessage.type}`}>
          {submitMessage.text}
        </div>
      )}
    </div>
  );
};

export default UcsRegistrationForm;
